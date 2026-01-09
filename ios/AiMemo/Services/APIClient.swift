import Foundation

struct APIClient {
    static let shared = APIClient()

    private let baseURL: URL

    init() {
        let info = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String
        let urlString = info?.trimmingCharacters(in: .whitespacesAndNewlines)
        self.baseURL = URL(string: urlString?.isEmpty == false ? urlString! : "http://localhost:8799")!
    }

    func login(email: String, password: String) async throws -> AuthResponse {
        try await post(path: "/auth/login", payload: [
            "email": email,
            "password": password,
        ])
    }

    func register(email: String, password: String, displayName: String?) async throws -> AuthResponse {
        var payload: [String: String] = [
            "email": email,
            "password": password,
        ]
        if let displayName, !displayName.isEmpty {
            payload["display_name"] = displayName
        }
        return try await post(path: "/auth/register", payload: payload)
    }

    func oauthApple(idToken: String, email: String?, displayName: String?) async throws -> AuthResponse {
        var payload: [String: String] = [
            "id_token": idToken,
        ]
        if let email {
            payload["email"] = email
        }
        if let displayName, !displayName.isEmpty {
            payload["display_name"] = displayName
        }
        return try await post(path: "/auth/oauth/apple", payload: payload)
    }

    func me(token: String) async throws -> User {
        var request = URLRequest(url: baseURL.appendingPathComponent("/auth/me"))
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        if http.statusCode >= 400 {
            let error = try decodeError(from: data)
            throw NSError(domain: "AiMemo", code: http.statusCode, userInfo: [
                NSLocalizedDescriptionKey: error ?? "Request failed",
            ])
        }
        let wrapper = try JSONDecoder().decode([String: User].self, from: data)
        guard let user = wrapper["user"] else {
            throw NSError(domain: "AiMemo", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        return user
    }

    private func post<T: Decodable>(path: String, payload: [String: String]) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        if http.statusCode >= 400 {
            let error = try decodeError(from: data)
            throw NSError(domain: "AiMemo", code: http.statusCode, userInfo: [
                NSLocalizedDescriptionKey: error ?? "Request failed",
            ])
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func decodeError(from data: Data) throws -> String? {
        return try? JSONDecoder().decode(ErrorResponse.self, from: data).error
    }
}
