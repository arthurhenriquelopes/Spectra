using System;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SpectraInstaller
{
    public class WizardForm : Form
    {
        private Label titleLabel;
        private Label statusLabel;
        private ProgressBar progressBar;
        private Button actionButton;
        private string installDir;
        private static readonly HttpClient client = new HttpClient();

        public WizardForm()
        {
            // Install path: C:\Users\<User>\Spectra
            installDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Spectra");

            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "Spectra Setup";
            this.Size = new Size(450, 250);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            titleLabel = new Label
            {
                Text = "Welcome to Spectra Setup",
                Font = new Font("Segoe UI", 16, FontStyle.Bold),
                Location = new Point(20, 20),
                AutoSize = true
            };

            statusLabel = new Label
            {
                Text = "Click Install to download and set up Spectra.",
                Font = new Font("Segoe UI", 9, FontStyle.Regular),
                Location = new Point(25, 70),
                Size = new Size(380, 40)
            };

            progressBar = new ProgressBar
            {
                Location = new Point(25, 120),
                Size = new Size(380, 25),
                Style = ProgressBarStyle.Continuous
            };

            actionButton = new Button
            {
                Text = "Install",
                Location = new Point(305, 165),
                Size = new Size(100, 30),
                Font = new Font("Segoe UI", 9, FontStyle.Regular),
                BackColor = Color.FromArgb(0, 120, 215),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            actionButton.FlatAppearance.BorderSize = 0;
            actionButton.Click += ActionButton_Click;

            this.Controls.Add(titleLabel);
            this.Controls.Add(statusLabel);
            this.Controls.Add(progressBar);
            this.Controls.Add(actionButton);
        }

        private async void ActionButton_Click(object? sender, EventArgs e)
        {
            if (actionButton.Text == "Install")
            {
                actionButton.Enabled = false;
                await InstallSpectra();
            }
            else if (actionButton.Text == "Finish")
            {
                this.Close();
            }
            else if (actionButton.Text == "Launch")
            {
                LaunchSpectra();
                this.Close();
            }
        }

        private async Task InstallSpectra()
        {
            string zipUrl = "https://github.com/arthurhenriquelopes/Spectra/archive/refs/heads/main.zip";
            string tempZipFile = Path.Combine(Path.GetTempPath(), "spectra_main.zip");
            string extractTempDir = Path.Combine(Path.GetTempPath(), "spectra_extract_" + Guid.NewGuid().ToString());

            try
            {
                // Step 1: Download Zip
                UpdateStatus("Downloading latest release from GitHub...", 10);
                
                client.DefaultRequestHeaders.Add("User-Agent", "SpectraInstaller");
                byte[] fileBytes = await client.GetByteArrayAsync(zipUrl);
                await System.IO.File.WriteAllBytesAsync(tempZipFile, fileBytes);
                
                // Step 2: Extract Zip
                UpdateStatus("Extracting files...", 50);
                if (Directory.Exists(extractTempDir))
                    Directory.Delete(extractTempDir, true);
                
                ZipFile.ExtractToDirectory(tempZipFile, extractTempDir);

                // Step 3: Move to Install Directory
                UpdateStatus("Installing to " + installDir + "...", 70);
                string sourceDir = Path.Combine(extractTempDir, "Spectra-main");

                if (Directory.Exists(installDir))
                {
                    // Clean up existing directory if overwriting
                    Directory.Delete(installDir, true);
                }
                
                Directory.Move(sourceDir, installDir);

                // Step 4: Create Desktop Shortcut
                UpdateStatus("Creating Desktop shortcut...", 90);
                CreateShortcut();

                // Cleanup temp
                if (System.IO.File.Exists(tempZipFile)) System.IO.File.Delete(tempZipFile);
                if (Directory.Exists(extractTempDir)) Directory.Delete(extractTempDir, true);

                UpdateStatus("Installation complete!", 100);
                actionButton.Text = "Launch";
                actionButton.Enabled = true;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Installation failed:\n" + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                UpdateStatus("Installation failed.", 0);
                actionButton.Text = "Finish";
                actionButton.Enabled = true;
            }
        }

        private void CreateShortcut()
        {
            string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
            string shortcutLocation = Path.Combine(desktopPath, "Spectra.lnk");
            string targetPath = Path.Combine(installDir, "Spectra.exe");

            if (!System.IO.File.Exists(targetPath)) return;

            Type t = Type.GetTypeFromProgID("WScript.Shell");
            dynamic shell = Activator.CreateInstance(t);
            dynamic shortcut = shell.CreateShortcut(shortcutLocation);
            
            shortcut.Description = "Spectra AI";
            shortcut.IconLocation = targetPath + ", 0";
            shortcut.TargetPath = targetPath;
            shortcut.WorkingDirectory = installDir;
            shortcut.Save();
        }

        private void LaunchSpectra()
        {
            string targetPath = Path.Combine(installDir, "Spectra.exe");
            if (System.IO.File.Exists(targetPath))
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = targetPath,
                    WorkingDirectory = installDir,
                    UseShellExecute = true
                });
            }
        }

        private void UpdateStatus(string message, int progress)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => { statusLabel.Text = message; progressBar.Value = progress; }));
            }
            else
            {
                statusLabel.Text = message;
                progressBar.Value = progress;
            }
        }
    }
}
