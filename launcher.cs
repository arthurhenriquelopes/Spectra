using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

class Program
{
    static void Main(string[] args)
    {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string venvPython = Path.Combine(baseDir, @"venv\Scripts\WinSysHost.exe");
        string originalPython = Path.Combine(baseDir, @"venv\Scripts\python.exe");
        string setupBat = Path.Combine(baseDir, "Setup.bat");
        
        if (!File.Exists(originalPython))
        {
            if (File.Exists(setupBat))
            {
                MessageBox.Show("Bem-vindo ao Spectra!\n\nComo esta é a primeira vez que você abre o aplicativo, precisamos instalar as dependências.\n\nUma janela de terminal vai se abrir para baixar os arquivos necessários. Por favor, aguarde.", "Spectra - Instalação Inicial", MessageBoxButtons.OK, MessageBoxIcon.Information);
                
                ProcessStartInfo setupInfo = new ProcessStartInfo();
                setupInfo.FileName = setupBat;
                setupInfo.WorkingDirectory = baseDir;
                setupInfo.UseShellExecute = true;
                
                try
                {
                    Process setupProcess = Process.Start(setupInfo);
                    setupProcess.WaitForExit();
                }
                catch (Exception)
                {
                    return;
                }
                
                if (!File.Exists(originalPython))
                {
                    MessageBox.Show("A instalação não foi concluída corretamente. O Spectra não pode iniciar.", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return; 
                }
            }
            else
            {
                MessageBox.Show("Não foi possível encontrar a pasta virtual do Python (venv) nem o arquivo Setup.bat.", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
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
        }
    }
}
