import AuthenticationServices
import Foundation

@MainActor
final class SessionStore: ObservableObject {
    @Published var user: User?
    @Published var token: String?
    @Published var errorMessage: String?
    @Published var isLoading = false

    private let tokenKey = "aimemo_token"

    init() {
        token = UserDefaults.standard.string(forKey: tokenKey)
        Task {
            await loadSession()
        }
    }

    var isAuthenticated: Bool {
        token != nil && user != nil
    }

    func loadSession() async {
        guard let token else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let me = try await APIClient.shared.me(token: token)
            user = me
        } catch {
            signOut()
        }
    }

    func signOut() {
        token = nil
        user = nil
        UserDefaults.standard.removeObject(forKey: tokenKey)
    }

    func login(email: String, password: String) async {
        await authenticate {
            try await APIClient.shared.login(email: email, password: password)
        }
    }

    func register(email: String, password: String, displayName: String?) async {
        await authenticate {
            try await APIClient.shared.register(email: email, password: password, displayName: displayName)
        }
    }

    func signInWithApple(idToken: String, email: String?, displayName: String?) async {
        await authenticate {
            try await APIClient.shared.oauthApple(idToken: idToken, email: email, displayName: displayName)
        }
    }

    private func authenticate(_ operation: () async throws -> AuthResponse) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let response = try await operation()
            token = response.accessToken
            user = response.user
            errorMessage = nil
            UserDefaults.standard.set(response.accessToken, forKey: tokenKey)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
