package art.lazying.memo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AiMemoTheme {
                AiMemoApp()
            }
        }
    }
}

@Composable
private fun AiMemoApp() {
    val context = LocalContext.current
    val repo = remember { AuthRepository(context) }
    val tokenStore = remember { TokenStore(context) }
    val scope = rememberCoroutineScope()

    var token by remember { mutableStateOf(tokenStore.loadToken()) }
    var user by remember { mutableStateOf<User?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    LaunchedEffect(token) {
        if (token != null && user == null) {
            loading = true
            try {
                user = repo.me(token!!)
            } catch (ex: Exception) {
                token = null
                tokenStore.clearToken()
            } finally {
                loading = false
            }
        }
    }

    Surface(modifier = Modifier.fillMaxSize()) {
        if (token == null || user == null) {
            AuthScreen(
                loading = loading,
                error = error,
                onLogin = { email, password ->
                    scope.launch {
                        loading = true
                        error = null
                        try {
                            val response = repo.login(email, password)
                            token = response.accessToken
                            user = response.user
                            tokenStore.saveToken(response.accessToken)
                        } catch (ex: Exception) {
                            error = ex.message
                        } finally {
                            loading = false
                        }
                    }
                },
                onRegister = { email, password, displayName ->
                    scope.launch {
                        loading = true
                        error = null
                        try {
                            val response = repo.register(email, password, displayName)
                            token = response.accessToken
                            user = response.user
                            tokenStore.saveToken(response.accessToken)
                        } catch (ex: Exception) {
                            error = ex.message
                        } finally {
                            loading = false
                        }
                    }
                }
            )
        } else {
            MainTabs(
                user = user,
                onSignOut = {
                    tokenStore.clearToken()
                    token = null
                    user = null
                }
            )
        }
    }
}

@Composable
private fun AuthScreen(
    loading: Boolean,
    error: String?,
    onLogin: (String, String) -> Unit,
    onRegister: (String, String, String?) -> Unit,
) {
    var mode by remember { mutableStateOf(AuthMode.LOGIN) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var displayName by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("AiMemo", style = MaterialTheme.typography.headlineMedium)
        Text("Your conversational ledger", style = MaterialTheme.typography.bodyMedium)

        TabRow(selectedTabIndex = mode.ordinal) {
            Tab(selected = mode == AuthMode.LOGIN, onClick = { mode = AuthMode.LOGIN }) {
                Text("Sign in", modifier = Modifier.padding(12.dp))
            }
            Tab(selected = mode == AuthMode.REGISTER, onClick = { mode = AuthMode.REGISTER }) {
                Text("Create account", modifier = Modifier.padding(12.dp))
            }
        }

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth(),
        )

        if (mode == AuthMode.REGISTER) {
            OutlinedTextField(
                value = displayName,
                onValueChange = { displayName = it },
                label = { Text("Name") },
                modifier = Modifier.fillMaxWidth(),
            )
        }

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
        )

        Button(
            onClick = {
                if (mode == AuthMode.LOGIN) {
                    onLogin(email, password)
                } else {
                    onRegister(email, password, displayName)
                }
            },
            enabled = !loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (mode == AuthMode.LOGIN) "Continue" else "Create account")
        }

        Text("OAuth", fontSize = 12.sp)
        Button(onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth()) {
            Text("Continue with Google (configure SDK)")
        }
        Button(onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth()) {
            Text("Continue with Apple (configure SDK)")
        }

        if (error != null) {
            Text(error, color = MaterialTheme.colorScheme.error)
        }
    }
}

@Composable
private fun MainTabs(user: User?, onSignOut: () -> Unit) {
    var selectedTab by remember { mutableStateOf(BottomTab.IDEAS) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                BottomTab.values().forEach { tab ->
                    NavigationBarItem(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        label = { Text(tab.label) },
                        icon = { Icon(tab.icon, contentDescription = tab.label) }
                    )
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (selectedTab) {
                BottomTab.IDEAS -> TabContent("Ideas", "Capture new concepts and convert them to rows.")
                BottomTab.CHAT -> TabContent("Chat", "Collaborate with teammates in shared threads.")
                BottomTab.STUDIO -> TabContent("Studio", "Generate summaries, tables, and reports.")
                BottomTab.SETTINGS -> SettingsContent(user = user, onSignOut = onSignOut)
            }
        }
    }
}

@Composable
private fun TabContent(title: String, body: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(title, style = MaterialTheme.typography.headlineSmall)
        Text(body)
    }
}

@Composable
private fun SettingsContent(user: User?, onSignOut: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Settings", style = MaterialTheme.typography.headlineSmall)
        if (user?.email != null) {
            Text("Signed in as ${user.email}")
        }
        Button(onClick = onSignOut) {
            Text("Sign out")
        }
    }
}

private enum class AuthMode {
    LOGIN,
    REGISTER
}

private enum class BottomTab(val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    IDEAS("Ideas", Icons.Default.Lightbulb),
    CHAT("Chat", Icons.Default.ChatBubble),
    STUDIO("Studio", Icons.Default.AutoAwesome),
    SETTINGS("Settings", Icons.Default.Settings),
}

@Composable
private fun AiMemoTheme(content: @Composable () -> Unit) {
    val colors = lightColorScheme(
        primary = Color(0xFF2F6FED),
        secondary = Color(0xFF1B2A41),
        surface = Color(0xFFF9F9FB),
    )
    MaterialTheme(colorScheme = colors, typography = Typography(), content = content)
}
