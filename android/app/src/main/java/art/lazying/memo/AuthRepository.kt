package art.lazying.memo

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class AuthRepository(context: Context) {
    private val client = OkHttpClient()
    private val baseUrl = context.getString(R.string.api_base_url).trimEnd('/')

    suspend fun login(email: String, password: String): AuthResponse =
        postAuth("/auth/login", mapOf("email" to email, "password" to password))

    suspend fun register(email: String, password: String, displayName: String?): AuthResponse {
        val payload = mutableMapOf("email" to email, "password" to password)
        if (!displayName.isNullOrBlank()) {
            payload["display_name"] = displayName
        }
        return postAuth("/auth/register", payload)
    }

    suspend fun me(token: String): User = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("$baseUrl/auth/me")
            .addHeader("Authorization", "Bearer $token")
            .get()
            .build()
        client.newCall(request).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw IllegalStateException(parseError(body))
            }
            val json = JSONObject(body)
            val userJson = json.getJSONObject("user")
            parseUser(userJson)
        }
    }

    private suspend fun postAuth(path: String, payload: Map<String, String>): AuthResponse =
        withContext(Dispatchers.IO) {
            val bodyJson = JSONObject(payload).toString()
            val request = Request.Builder()
                .url("$baseUrl$path")
                .post(bodyJson.toRequestBody(JSON_MEDIA))
                .build()
            client.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    throw IllegalStateException(parseError(body))
                }
                val json = JSONObject(body)
                val token = json.getString("access_token")
                val user = parseUser(json.getJSONObject("user"))
                AuthResponse(token, user)
            }
        }

    private fun parseUser(json: JSONObject): User {
        return User(
            id = json.getString("id"),
            email = json.optString("email").ifBlank { null },
            displayName = json.optString("display_name").ifBlank { null },
            provider = json.getString("provider"),
        )
    }

    private fun parseError(body: String): String {
        return runCatching {
            val json = JSONObject(body)
            json.optString("error", "Request failed")
        }.getOrDefault("Request failed")
    }

    companion object {
        private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()
    }
}
