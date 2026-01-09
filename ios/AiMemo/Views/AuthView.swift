import AuthenticationServices
import SwiftUI

struct AuthView: View {
    @EnvironmentObject var session: SessionStore

    @State private var mode: AuthMode = .login
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""

    var body: some View {
        VStack(spacing: 16) {
            Picker("Mode", selection: $mode) {
                Text("Sign in").tag(AuthMode.login)
                Text("Create account").tag(AuthMode.register)
            }
            .pickerStyle(.segmented)

            VStack(alignment: .leading, spacing: 12) {
                TextField("Email", text: $email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .textFieldStyle(.roundedBorder)

                if mode == .register {
                    TextField("Name", text: $displayName)
                        .textFieldStyle(.roundedBorder)
                }

                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)

                Button(mode == .login ? "Continue" : "Create account") {
                    Task {
                        if mode == .login {
                            await session.login(email: email, password: password)
                        } else {
                            await session.register(email: email, password: password, displayName: displayName)
                        }
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(session.isLoading)
            }

            Divider()

            VStack(spacing: 12) {
                SignInWithAppleButton(.signIn) { request in
                    request.requestedScopes = [.fullName, .email]
                } onCompletion: { result in
                    handleAppleResult(result)
                }
                .frame(height: 48)

                Button("Continue with Google") {
                    session.errorMessage = "Google sign-in is not wired yet."
                }
                .buttonStyle(.bordered)
            }

            if let error = session.errorMessage {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            Spacer()
        }
        .padding()
    }

    private func handleAppleResult(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let credential = auth.credential as? ASAuthorizationAppleIDCredential else { return }
            guard let tokenData = credential.identityToken,
                  let token = String(data: tokenData, encoding: .utf8)
            else {
                session.errorMessage = "Apple sign-in failed to return a token."
                return
            }
            let name = [credential.fullName?.givenName, credential.fullName?.familyName]
                .compactMap { $0 }
                .joined(separator: " ")
            Task {
                await session.signInWithApple(idToken: token, email: credential.email, displayName: name)
            }
        case .failure(let error):
            session.errorMessage = error.localizedDescription
        }
    }
}

enum AuthMode {
    case login
    case register
}
