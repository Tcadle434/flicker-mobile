require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'FlickerAudio'
  s.version = package['version']
  s.summary = 'Flicker audio native module'
  s.description = 'Expo module for the Flicker native audio engine.'
  s.license = { :type => 'MIT' }
  s.author = { 'Flicker' => 'dev@flicker.app' }
  s.homepage = 'https://flicker.app'
  s.platforms = { :ios => '15.1' }
  s.swift_version = '5.9'
  s.source = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation'
  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  s.resource_bundles = {
    'FlickerAudioAssets' => [
      'resources/audio/*.wav',
      'resources/audio/*.caf',
      'resources/audio/*.m4a',
      'resources/audio/*.mp3',
      'resources/audio/*.aac'
    ]
  }
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
end
