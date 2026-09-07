import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        ZStack {
            Color(red: 0.035, green: 0.051, blue: 0.075)
                .ignoresSafeArea()
            VStack(spacing: 12) {
                Text("Aurix Admin")
                    .font(.largeTitle.bold())
                Text("Loading control panel…")
                    .foregroundStyle(.secondary)
            }
            AurixWebView()
                .ignoresSafeArea(.container, edges: .bottom)
        }
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
        view.backgroundColor = .clear
        view.scrollView.backgroundColor = .clear

        let page = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web")
            ?? Bundle.main.url(forResource: "index", withExtension: "html")
            ?? Bundle.main.resourceURL.flatMap { root in
                FileManager.default.enumerator(at: root,
                                               includingPropertiesForKeys: nil)?
                    .compactMap { $0 as? URL }
                    .first { $0.lastPathComponent == "index.html" }
            }

        guard let page else {
            view.loadHTMLString("""
            <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
            <body style="margin:0;background:#090d13;color:white;font-family:-apple-system;padding:40px 22px">
            <h1>Aurix Admin</h1><p>index.html was not included in this build.</p></body>
            """, baseURL: nil)
            return view
        }
        do {
            let html = try String(contentsOf: page, encoding: .utf8)
            view.loadHTMLString(html, baseURL: page.deletingLastPathComponent())
        } catch {
            view.loadHTMLString("""
            <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
            <body style="margin:0;background:#090d13;color:white;font-family:-apple-system;padding:40px 22px">
            <h1>Aurix Admin</h1><p>Could not read the bundled website.</p></body>
            """, baseURL: nil)
        }
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
