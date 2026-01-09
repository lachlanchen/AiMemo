import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var session: SessionStore

    var body: some View {
        TabView {
            NavigationView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Ideas")
                        .font(.title2)
                        .bold()
                    Text("Capture the first spark and turn it into structured notes.")
                }
                .padding()
            }
            .tabItem {
                Label("Ideas", systemImage: "lightbulb")
            }

            NavigationView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Chat")
                        .font(.title2)
                        .bold()
                    Text("Start a conversation and invite collaborators.")
                }
                .padding()
            }
            .tabItem {
                Label("Chat", systemImage: "bubble.left.and.bubble.right")
            }

            NavigationView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Studio")
                        .font(.title2)
                        .bold()
                    Text("Generate summaries, tables, and reports.")
                }
                .padding()
            }
            .tabItem {
                Label("Studio", systemImage: "sparkles")
            }

            NavigationView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Settings")
                        .font(.title2)
                        .bold()
                    if let email = session.user?.email {
                        Text("Signed in as \(email)")
                    }
                    Button("Sign out") {
                        session.signOut()
                    }
                    .buttonStyle(.bordered)
                }
                .padding()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
    }
}
