package art.lazying.memo

data class User(
    val id: String,
    val email: String?,
    val displayName: String?,
    val provider: String,
)

data class AuthResponse(
    val accessToken: String,
    val user: User,
)
