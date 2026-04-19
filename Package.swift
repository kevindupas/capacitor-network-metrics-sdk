// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "CapacitorNetworkMetricsSdk",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapacitorNetworkMetricsSdk",
            targets: ["NetworkMetricsSdkPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main"),
        .package(url: "https://github.com/kevindupas/ios-network-metrics-sdk.git", from: "1.0.15"),
    ],
    targets: [
        .target(
            name: "NetworkMetricsSdkPlugin",
            dependencies: [
                .product(name: "Capacitor",           package: "capacitor-swift-pm"),
                .product(name: "Cordova",             package: "capacitor-swift-pm"),
                .product(name: "NetworkMetricsSDK",   package: "ios-network-metrics-sdk"),
            ],
            path: "ios/Sources/NetworkMetricsSdkPlugin"
        )
    ]
)
