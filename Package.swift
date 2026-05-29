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
    ],
    targets: [
        .target(
            name: "NetworkMetricsSDK",
            path: "ios/Sources/NetworkMetricsSDK"
        ),
        .target(
            name: "NetworkMetricsSdkPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova",   package: "capacitor-swift-pm"),
                .byName(name: "NetworkMetricsSDK"),
            ],
            path: "ios/Sources/NetworkMetricsSdkPlugin"
        )
    ]
)
