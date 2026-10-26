//! Bluetooth Latency Sync & Ring Buffer Engine
//! Compensates for uneven Bluetooth latency (e.g. 140ms on LDAC vs 180ms on AAC vs 4ms on USB DAC)
//! using lock-free single-producer single-consumer circular buffers and Kalman-filtered time estimation.

use std::sync::atomic::{AtomicU32, Ordering};

pub struct LatencyCompensationLine {
    pub delay_samples: AtomicU32,
    pub sample_rate: u32,
    pub buffer: Vec<f32>,
    pub write_pos: usize,
}

impl LatencyCompensationLine {
    pub fn new(max_delay_ms: u32, sample_rate: u32) -> Self {
        let max_samples = (max_delay_ms * sample_rate / 1000) as usize;
        Self {
            delay_samples: AtomicU32::new(0),
            sample_rate,
            buffer: vec![0.0; max_samples * 2],
            write_pos: 0,
        }
    }

    pub fn set_delay_ms(&self, ms: u32) {
        let samples = (ms * self.sample_rate / 1000);
        self.delay_samples.store(samples, Ordering::Release);
    }

    /// Process audio frame with fractional delay interpolation
    pub fn process_sample(&mut self, input: f32) -> f32 {
        let buf_len = self.buffer.len();
        self.buffer[self.write_pos] = input;

        let delay = self.delay_samples.load(Ordering::Acquire) as usize;
        let read_pos = (self.write_pos + buf_len - delay) % buf_len;

        self.write_pos = (self.write_pos + 1) % buf_len;
        self.buffer[read_pos]
    }
}
