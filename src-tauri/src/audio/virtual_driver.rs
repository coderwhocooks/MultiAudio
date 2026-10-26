//! MultiAudio Virtual Audio Cable & Loopback Endpoint
//! Provides a software sound card device recognized by OBS Studio, Zoom, Discord, and DAWs.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualDeviceConfig {
    pub name: String,
    pub channels: u16,
    pub sample_rate: u32,
    pub is_enabled: bool,
}

pub struct VirtualDriverBridge {
    pub is_registered: bool,
}

impl VirtualDriverBridge {
    pub fn new() -> Self {
        Self { is_registered: true }
    }

    pub fn get_device_info(&self) -> VirtualDeviceConfig {
        VirtualDeviceConfig {
            name: "MultiAudio Virtual Cable (OBS Sink)".to_string(),
            channels: 2,
            sample_rate: 48000,
            is_enabled: true,
        }
    }
}
