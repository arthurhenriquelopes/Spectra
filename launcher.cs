using System;
using System.Diagnostics;
using System.IO;

class Program
{
    static void Main(string[] args)
    {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string venvPython = Path.Combine(baseDir, @"venv\Scripts\NetworkAdapter.exe");
        string originalPython = Path.Combine(baseDir, @"venv\Scripts\pythonw.exe");
        
        if (!File.Exists(originalPython))
        {
            // venv might not be created yet
            return;
        }

        if (!File.Exists(venvPython))
        {
            File.Copy(originalPython, venvPython);
        }

        ProcessStartInfo startInfo = new ProcessStartInfo();
        startInfo.FileName = venvPython;
        startInfo.Arguments = "main.py";
        startInfo.UseShellExecute = false;
        startInfo.CreateNoWindow = true;
        startInfo.WorkingDirectory = baseDir;
        
        try
        {
            Process.Start(startInfo);
        }
        catch (Exception)
        {
            // Silently fail
        }
    }
}
