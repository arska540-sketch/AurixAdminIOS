import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        AurixWebView()
            .background(Color(red: 0.035, green: 0.051, blue: 0.075))
            .ignoresSafeArea(.container, edges: .bottom)
    }
}

struct AurixWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.035, green: 0.051, blue: 0.075, alpha: 1)

        guard let page = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web")
                ?? Bundle.main.url(forResource: "index", withExtension: "html") else {
            return view
        }
        view.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if navigationAction.navigationType == .linkActivated,
               let scheme = url.scheme?.lowercased(),
               scheme == "http" || scheme == "https" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }
    }
}
