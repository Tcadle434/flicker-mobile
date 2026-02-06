import React, { useCallback, useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { GLRenderer } from '../../rendering/core/GLRenderer';
import { SessionScene } from '../../rendering/scenes/SessionScene';
import type { MoodState } from '../../constants/moodThemes';

interface SessionVisualProps {
  mood: MoodState;
  padX: number;
  padY: number;
}

export function SessionVisual({ mood, padX, padY }: SessionVisualProps) {
  const glRendererRef = useRef<GLRenderer | null>(null);
  const sessionSceneRef = useRef<SessionScene | null>(null);
  const currentMoodRef = useRef(mood);
  const padRef = useRef({ x: padX, y: padY });

  // Update refs without re-creating GL context
  padRef.current = { x: padX, y: padY };

  if (currentMoodRef.current !== mood) {
    currentMoodRef.current = mood;
    sessionSceneRef.current?.setMood(mood);
  }

  useEffect(() => {
    sessionSceneRef.current?.setPadPosition(padX, padY);
  }, [padX, padY]);

  useEffect(() => {
    return () => {
      glRendererRef.current?.dispose();
      sessionSceneRef.current?.dispose();
    };
  }, []);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    const glRenderer = new GLRenderer(gl);
    glRendererRef.current = glRenderer;

    const sessionScene = new SessionScene(
      glRenderer.renderer,
      currentMoodRef.current,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
    );
    sessionSceneRef.current = sessionScene;

    glRenderer.startRenderLoop((time) => {
      sessionScene.setPadPosition(padRef.current.x, padRef.current.y);
      sessionScene.update(time);
    });
  }, []);

  return (
    <GLView
      style={styles.container}
      onContextCreate={onContextCreate}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
