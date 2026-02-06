#!/usr/bin/env python3
"""Generate synthetic but musically coherent audio loops for Sona.

These are placeholders intended to be replaced by licensed real-world assets.
They are designed to be seamless (loop boundaries align) and match the native
engine's preferred 48kHz stereo format.
"""

import math
import os
import random
import wave
from array import array

SAMPLE_RATE = 48000
DURATION_SECONDS = 20.0
NUM_SAMPLES = int(SAMPLE_RATE * DURATION_SECONDS)
TWO_PI = 2.0 * math.pi

OUTPUT_DIR = os.path.join("ios", "Sona", "audio")


def clamp(value: float) -> float:
    return max(-1.0, min(1.0, value))


def write_wav(path: str, sample_fn, gain: float = 0.8) -> None:
    data = array("h")
    for i in range(NUM_SAMPLES):
        t = i / SAMPLE_RATE
        left, right = sample_fn(t)
        left = clamp(left * gain)
        right = clamp(right * gain)
        data.append(int(left * 32767))
        data.append(int(right * 32767))

    with wave.open(path, "wb") as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(data.tobytes())


def build_ambient():
    freqs = [110.0, 220.0, 330.0, 440.0, 550.0]
    phases_l = [random.random() * TWO_PI for _ in freqs]
    phases_r = [phase + 0.35 for phase in phases_l]

    def sample(t: float):
        pad_l = 0.0
        pad_r = 0.0
        for idx, freq in enumerate(freqs):
            pad_l += math.sin(TWO_PI * freq * t + phases_l[idx])
            pad_r += math.sin(TWO_PI * freq * t + phases_r[idx])
        pad_l /= len(freqs)
        pad_r /= len(freqs)

        lfo = 0.55 + 0.45 * math.sin(TWO_PI * 0.05 * t)
        shimmer = 0.12 * math.sin(TWO_PI * 0.25 * t)
        return (pad_l * lfo + shimmer) * 0.35, (pad_r * lfo - shimmer) * 0.35

    return sample


def build_nature():
    components = []
    min_n = int(200.0 * DURATION_SECONDS)
    max_n = int(1800.0 * DURATION_SECONDS)
    for _ in range(24):
        n = random.randint(min_n, max_n)
        freq = n / DURATION_SECONDS
        phase_l = random.random() * TWO_PI
        phase_r = phase_l + random.uniform(0.1, 0.4)
        amplitude = (1.0 / freq) * random.uniform(0.5, 1.1)
        components.append((freq, phase_l, phase_r, amplitude))

    def sample(t: float):
        noise_l = 0.0
        noise_r = 0.0
        for freq, phase_l, phase_r, amplitude in components:
            noise_l += math.sin(TWO_PI * freq * t + phase_l) * amplitude
            noise_r += math.sin(TWO_PI * freq * t + phase_r) * amplitude
        gust = 0.6 + 0.4 * math.sin(TWO_PI * 0.03 * t)
        return noise_l * gust * 0.9, noise_r * gust * 0.9

    return sample


def build_melody():
    bpm = 120.0
    beat_length = 60.0 / bpm
    scale = [261.63, 329.63, 392.0, 493.88, 523.25, 493.88, 392.0, 329.63]

    def envelope(phase: float) -> float:
        attack = 0.02
        decay = 0.12
        if phase < attack:
            return phase / attack
        if phase < attack + decay:
            return 1.0 - (phase - attack) / decay * 0.4
        return 0.6

    def sample(t: float):
        beat_index = int(t / beat_length)
        phase = t % beat_length
        freq = scale[beat_index % len(scale)]
        amp = envelope(phase)
        tone = math.sin(TWO_PI * freq * t) * amp
        # subtle stereo offset
        tone_r = math.sin(TWO_PI * (freq + 0.4) * t + 0.2) * amp
        return tone * 0.35, tone_r * 0.35

    return sample


def build_rhythm():
    bpm = 120.0
    beat_length = 60.0 / bpm

    def sample(t: float):
        beat_index = int(t / beat_length)
        phase = t % beat_length
        kick = 0.0
        hat = 0.0

        if beat_index % 4 == 0:
            kick_env = math.exp(-phase * 18.0)
            kick = math.sin(TWO_PI * 90.0 * t) * kick_env
        if beat_index % 2 == 1:
            hat_env = math.exp(-phase * 40.0)
            hat = math.sin(TWO_PI * 320.0 * t) * hat_env

        signal = (kick * 0.9 + hat * 0.25)
        return signal * 0.4, signal * 0.4

    return sample


def build_synthesis():
    base_left = 200.0
    base_right = 206.0
    harmonics = [400.0, 600.0]

    def sample(t: float):
        lfo = 0.7 + 0.3 * math.sin(TWO_PI * 0.08 * t)
        left = math.sin(TWO_PI * base_left * t)
        right = math.sin(TWO_PI * base_right * t)
        for freq in harmonics:
            left += 0.2 * math.sin(TWO_PI * freq * t)
            right += 0.2 * math.sin(TWO_PI * (freq + 0.4) * t)
        return left * lfo * 0.35, right * lfo * 0.35

    return sample


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    assets = [
        ("ambient_loop_01.wav", build_ambient()),
        ("nature_loop_01.wav", build_nature()),
        ("melody_loop_01.wav", build_melody()),
        ("rhythm_loop_01.wav", build_rhythm()),
        ("synthesis_loop_01.wav", build_synthesis()),
    ]

    for filename, sample_fn in assets:
        path = os.path.join(OUTPUT_DIR, filename)
        print(f"Generating {path}...")
        write_wav(path, sample_fn, gain=0.85)


if __name__ == "__main__":
    random.seed(7)
    main()
