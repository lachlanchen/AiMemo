import Foundation

struct User: Codable {
    let id: String
    let email: String?
    let displayName: String?
    let provider: String

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case displayName = "display_name"
        case provider
    }
}

struct AuthResponse: Codable {
    let accessToken: String
    let user: User

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case user
    }
}

struct ErrorResponse: Codable {
    let error: String?
}
