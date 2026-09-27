Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

electronPath = "node_modules\electron\dist\electron.exe"
adapterPath = "node_modules\electron\dist\NetworkAdapter.exe"

If fso.FileExists(electronPath) Then
    If Not fso.FileExists(adapterPath) Then
        fso.CopyFile electronPath, adapterPath, True
    End If
    WshShell.Run """" & adapterPath & """ .", 0, False
Else
    WshShell.Run "cmd /c npm start", 0, False
End If
