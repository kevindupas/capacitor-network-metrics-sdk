Pod::Spec.new do |s|
  s.name             = 'NetworkMetricsSdkPlugin'
  s.version          = '1.0.0'
  s.summary          = 'Capacitor plugin for network metrics measurement'
  s.homepage         = 'https://github.com/kevindupas/capacitor-network-metrics-sdk'
  s.license          = { :type => 'MIT' }
  s.author           = { 'Kevin Dupas' => 'dupas.dev@gmail.com' }
  s.source           = { :git => 'https://github.com/kevindupas/capacitor-network-metrics-sdk.git', :tag => s.version.to_s }
  s.source_files     = 'ios/Sources/NetworkMetricsSdkPlugin/**/*.swift'
  s.ios.deployment_target = '14.0'
  s.swift_version    = '5.7'
  s.dependency 'Capacitor'
  s.dependency 'NetworkMetricsSDK', '~> 1.0'
end
