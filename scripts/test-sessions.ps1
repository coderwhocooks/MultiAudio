$source = @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Diagnostics;

namespace AudioHelper
{
    public enum EDataFlow { eRender, eCapture, eAll }
    public enum ERole { eConsole, eMultimedia, eCommunications }

    [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    [ComImport]
    public class MMDeviceEnumeratorComObject { }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator
    {
        int EnumAudioEndpoints(EDataFlow dataFlow, int dwStateMask, out IMMDeviceCollection ppDevices);
        int GetDefaultAudioEndpoint(EDataFlow dataFlow, ERole role, out IMMDevice ppEndpoint);
        int GetDevice(string pwstrId, out IMMDevice ppDevice);
    }

    [Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceCollection
    {
        int GetCount(out int pcDevices);
        int Item(int nDevice, out IMMDevice ppDevice);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice
    {
        int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
        int OpenPropertyStore(int stgmAccess, out IntPtr ppProperties);
        int GetId([MarshalAs(UnmanagedType.LPWStr)] out string ppstrId);
        int GetState(out int pdwState);
    }

    [Guid("77AA99A0-1BD6-484F-BC0A-070F04770C16"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionManager2
    {
        int GetAudioSessionControl(IntPtr AudioSessionGuid, int StreamFlags, out IntPtr SessionControl);
        int GetSimpleAudioVolume(IntPtr AudioSessionGuid, int StreamFlags, out IntPtr AudioVolume);
        int GetSessionEnumerator(out IAudioSessionEnumerator SessionEnum);
    }

    [Guid("E2F5EE11-2070-4E62-8149-DDF77DDC242F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionEnumerator
    {
        int GetCount(out int SessionCount);
        int GetSession(int SessionIndex, out IAudioSessionControl Session);
    }

    [Guid("F4B49C88-2104-4F07-9CBA-588A1F45E380"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionControl
    {
        int GetState(out int pRetVal);
        int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    }

    [Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionControl2
    {
        int GetState(out int pRetVal);
        int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int SetDisplayName(string Value, IntPtr EventContext);
        int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int SetIconPath(string Value, IntPtr EventContext);
        int GetGroupingParam(out Guid pRetVal);
        int SetGroupingParam(ref Guid Override, IntPtr EventContext);
        int RegisterAudioSessionNotification(IntPtr NewNotifications);
        int UnregisterAudioSessionNotification(IntPtr NewNotifications);
        int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
        int IsSystemSoundsSession();
        int SetDuckingPreference(bool optOut);
        int GetProcessId(out uint pRetVal);
    }

    [Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface ISimpleAudioVolume
    {
        int SetMasterVolume(float fLevel, IntPtr EventContext);
        int GetMasterVolume(out float pfLevel);
        int SetMute(bool bMute, IntPtr EventContext);
        int GetMute(out bool pbMute);
    }

    public class SessionInfo
    {
        public uint ProcessId { get; set; }
        public string ProcessName { get; set; }
        public string WindowTitle { get; set; }
        public float Volume { get; set; }
        public bool Muted { get; set; }
        public string DeviceId { get; set; }
        public int State { get; set; }
    }

    public static class Manager
    {
        public static List<SessionInfo> GetSessions()
        {
            var results = new List<SessionInfo>();
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDeviceCollection devices;
            enumerator.EnumAudioEndpoints(EDataFlow.eRender, 1, out devices);
            int devCount;
            devices.GetCount(out devCount);

            Guid IID_IAudioSessionManager2 = typeof(IAudioSessionManager2).GUID;

            for (int i = 0; i < devCount; i++)
            {
                IMMDevice dev;
                devices.Item(i, out dev);
                string devId;
                dev.GetId(out devId);

                object o;
                dev.Activate(ref IID_IAudioSessionManager2, 23, IntPtr.Zero, out o);
                var mgr = (IAudioSessionManager2)o;
                if (mgr == null) continue;

                IAudioSessionEnumerator sessionEnum;
                mgr.GetSessionEnumerator(out sessionEnum);
                if (sessionEnum == null) continue;

                int sCount;
                sessionEnum.GetCount(out sCount);

                for (int s = 0; s < sCount; s++)
                {
                    IAudioSessionControl ctl;
                    sessionEnum.GetSession(s, out ctl);
                    var ctl2 = ctl as IAudioSessionControl2;
                    var vol = ctl as ISimpleAudioVolume;

                    uint pid = 0;
                    if (ctl2 != null)
                    {
                        ctl2.GetProcessId(out pid);
                    }

                    float masterVol = 1.0f;
                    bool muted = false;
                    if (vol != null)
                    {
                        vol.GetMasterVolume(out masterVol);
                        vol.GetMute(out muted);
                    }

                    int state = 0;
                    ctl.GetState(out state);

                    string procName = "System Sounds";
                    string winTitle = "";
                    if (pid > 0)
                    {
                        try
                        {
                            var proc = Process.GetProcessById((int)pid);
                            procName = proc.ProcessName;
                            winTitle = proc.MainWindowTitle;
                        }
                        catch { }
                    }

                    results.Add(new SessionInfo
                    {
                        ProcessId = pid,
                        ProcessName = procName,
                        WindowTitle = winTitle,
                        Volume = masterVol,
                        Muted = muted,
                        DeviceId = devId,
                        State = state
                    });
                }
            }
            return results;
        }

        public static bool SetProcessVolume(uint targetPid, float volume, bool mute)
        {
            var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDeviceCollection devices;
            enumerator.EnumAudioEndpoints(EDataFlow.eRender, 1, out devices);
            int devCount;
            devices.GetCount(out devCount);

            Guid IID_IAudioSessionManager2 = typeof(IAudioSessionManager2).GUID;
            bool found = false;

            for (int i = 0; i < devCount; i++)
            {
                IMMDevice dev;
                devices.Item(i, out dev);
                object o;
                dev.Activate(ref IID_IAudioSessionManager2, 23, IntPtr.Zero, out o);
                var mgr = (IAudioSessionManager2)o;
                if (mgr == null) continue;

                IAudioSessionEnumerator sessionEnum;
                mgr.GetSessionEnumerator(out sessionEnum);
                if (sessionEnum == null) continue;

                int sCount;
                sessionEnum.GetCount(out sCount);

                for (int s = 0; s < sCount; s++)
                {
                    IAudioSessionControl ctl;
                    sessionEnum.GetSession(s, out ctl);
                    var ctl2 = ctl as IAudioSessionControl2;
                    var vol = ctl as ISimpleAudioVolume;

                    uint pid = 0;
                    if (ctl2 != null)
                    {
                        ctl2.GetProcessId(out pid);
                    }

                    if (pid == targetPid && vol != null)
                    {
                        vol.SetMasterVolume(volume, IntPtr.Zero);
                        vol.SetMute(mute, IntPtr.Zero);
                        found = true;
                    }
                }
            }
            return found;
        }
    }
}
"@

Add-Type -TypeDefinition $source -Language CSharp
$sessions = [AudioHelper.Manager]::GetSessions()
$sessions | Format-Table -AutoSize
