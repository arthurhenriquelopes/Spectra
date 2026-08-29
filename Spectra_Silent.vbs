Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

pythonwPath = "venv\Scripts\pythonw.exe"
adapterPath = "venv\Scripts\NetworkAdapter.exe"

If fso.FileExists(pythonwPath) Then
    If Not fso.FileExists(adapterPath) Then
        fso.CopyFile pythonwPath, adapterPath, True
    End If
    WshShell.Run """" & adapterPath & """ main.py", 0, False
Else
    WshShell.Run "pythonw main.py", 0, False
End If
