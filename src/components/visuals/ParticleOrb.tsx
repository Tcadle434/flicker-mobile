import React, { useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { FBOParticleSystem } from '../../rendering/particles/FBOParticleSystem';
import { moodThemes, MoodState } from '../../constants/moodThemes';

interface ParticleOrbProps {
  mood: MoodState;
  size: number;
  onTap?: () => void;
  style?: ViewStyle;
}

export function ParticleOrb({ mood, size, onTap, style }: ParticleOrbProps) {
  const particleSystemRef = useRef<FBOParticleSystem | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef = useRef<number | null>(null);
  const disposedRef = useRef(false);
  const currentMoodRef = useRef(mood);

  // Update mood params when mood changes
  useEffect(() => {
    currentMoodRef.current = mood;
    const theme = moodThemes[mood];
    particleSystemRef.current?.setParams({
      color: new THREE.Color(theme.orbColor),
      speed: theme.orbSpeed,
      turbulence: theme.orbTurbulence,
      pulseIntensity: theme.orbPulseIntensity,
    });
  }, [mood]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposedRef.current = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      particleSystemRef.current?.dispose();
      rendererRef.current?.dispose();
      particleSystemRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    if (disposedRef.current) return;

    const theme = moodThemes[currentMoodRef.current];

    const renderer = new THREE.WebGLRenderer({
      context: gl as any,
      canvas: {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: gl.drawingBufferHeight,
      } as any,
      alpha: true,
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const particleSystem = new FBOParticleSystem(renderer, {
      color: new THREE.Color(theme.orbColor),
      speed: theme.orbSpeed,
      turbulence: theme.orbTurbulence,
      particleSize: 2.0,
      pulseIntensity: theme.orbPulseIntensity,
    });
    particleSystem.setAspect(gl.drawingBufferWidth / gl.drawingBufferHeight);
    particleSystemRef.current = particleSystem;

    // 30fps render loop
    const startTime = Date.now();
    let lastFrame = 0;
    const FRAME_MS = 1000 / 30;

    const loop = () => {
      if (disposedRef.current) return;

      const now = Date.now();
      if (now - lastFrame >= FRAME_MS) {
        lastFrame = now;
        const time = (now - startTime) / 1000;
        renderer.clear();
        particleSystem.update(time);
        gl.endFrameEXP();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const orbTheme = moodThemes[mood];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onTap}
      disabled={!onTap}
      style={[styles.container, { width: size, height: size }, style]}
    >
      <View
        style={[
          styles.glowWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: orbTheme.orbColor,
          },
        ]}
      >
        <GLView
          style={[styles.glView, { width: size, height: size, borderRadius: size / 2 }]}
          onContextCreate={onContextCreate}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    shadowOpacity: 0.8,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
  },
  glView: {
    backgroundColor: 'transparent',
  },
});
