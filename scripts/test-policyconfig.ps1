# Check IPolicyConfig COM interfaces
$code = @"
using System;
using System.Runtime.InteropServices;

namespace AudioPolicy
{
    [ComImport]
    [Guid("870C3566-265F-481F-B448-425DEC0492CA")]
    public class PolicyConfigClient
    {
    }

    [Guid("f8679f50-850a-41cf-9c72-430f290290c8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IPolicyConfig
    {
        // Windows 10 RS4+ interface methods
        int GetMixFormat(string pszDeviceName, IntPtr ppFormat);
        int GetDeviceFormat(string pszDeviceName, int bDefault, IntPtr ppFormat);
        int ResetDeviceFormat(string pszDeviceName);
        int SetDeviceFormat(string pszDeviceName, IntPtr pEndpointFormat, IntPtr MixFormat);
        int GetProcessingPeriod(string pszDeviceName, int bDefault, IntPtr pmftDefaultPeriod, IntPtr pmftMinimumPeriod);
        int SetProcessingPeriod(string pszDeviceName, IntPtr pmftPeriod);
        int GetShareMode(string pszDeviceName, IntPtr pMode);
        int SetShareMode(string pszDeviceName, IntPtr mode);
        int GetPropertyValue(string pszDeviceName, int bStore, IntPtr key, IntPtr pv);
        int SetPropertyValue(string pszDeviceName, int bStore, IntPtr key, IntPtr pv);
        int SetDefaultEndpoint(string pszDeviceName, int role);
        int SetSetEndpointVisibility(string pszDeviceName, int bVisible);
    }
}
"@

Write-Host "Compiling test..."
