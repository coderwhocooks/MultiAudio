Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public enum ERole {
    eConsole = 0,
    eMultimedia = 1,
    eCommunications = 2
}

public enum EDataFlow {
    eRender = 0,
    eCapture = 1,
    eAll = 2
}

[ComImport]
[Guid("870C3566-037F-4E92-B857-81C1014B27C4")]
public class PolicyConfigClient { }

[Guid("f8679f50-850a-41cf-9c72-430f290290c8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IPolicyConfig {
    [PreserveSig] int GetMixFormat();
    [PreserveSig] int GetDeviceFormat();
    [PreserveSig] int SetDeviceFormat();
    [PreserveSig] int GetProcessingPeriod();
    [PreserveSig] int SetProcessingPeriod();
    [PreserveSig] int GetShareMode();
    [PreserveSig] int SetShareMode();
    [PreserveSig] int GetPropertyValue();
    [PreserveSig] int SetPropertyValue();
    [PreserveSig] int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string wszDeviceId, ERole eRole);
    [PreserveSig] int SetPersistedDefaultAudioEndpoint(
        uint processId,
        [MarshalAs(UnmanagedType.LPWStr)] string wszProcessPath,
        ERole eRole,
        EDataFlow eDataFlow,
        [MarshalAs(UnmanagedType.LPWStr)] string wszDeviceId
    );
}
'@ -ErrorAction SilentlyContinue

try {
    $client = New-Object PolicyConfigClient
    $policy = [IPolicyConfig]$client
    Write-Host "PolicyConfig COM client successfully initialized!"
} catch {
    Write-Host "Error creating PolicyConfig: $_"
}
