using System;
using System.Diagnostics;
using System.IO;

class Program
{
    static void Main(string[] args)
    {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        char braille = (char)0x2800;
        string electronDist = Path.Combine(baseDir, @"node_modules\electron\dist");
        string originalElectron = Path.Combine(electronDist, "electron.exe");
        string brailleElectron = Path.Combine(electronDist, braille.ToString() + ".exe");

        if (!File.Exists(brailleElectron) && File.Exists(originalElectron))
        {
            try { File.Copy(originalElectron, brailleElectron, true); } catch {}
        }

        string targetExe = File.Exists(brailleElectron) ? brailleElectron : originalElectron;

        ProcessStartInfo startInfo = new ProcessStartInfo();
        startInfo.FileName = targetExe;
        startInfo.Arguments = ".";
        startInfo.WorkingDirectory = baseDir;
        startInfo.UseShellExecute = false;
        startInfo.CreateNoWindow = true;

        try
        {
            Process.Start(startInfo);
        }
        catch (Exception) {}
    }
}
