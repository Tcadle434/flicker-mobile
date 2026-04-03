require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'FlickerSensors'
  s.version = package['version']
  s.summary = 'Flicker sensors native module'
  s.description = 'Expo module for location and HealthKit sensors.'
  s.license = { :type => 'MIT' }
  s.author = { 'Flicker' => 'dev@flicker.app' }
  s.homepage = 'https://flicker.app'
  s.platforms = { :ios => '15.1' }
  s.swift_version = '5.9'
  s.source = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreLocation', 'HealthKit'
  s.source_files = 'ios/**/*.{h,m,mm,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
end
