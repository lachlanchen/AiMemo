package art.lazying.memo

import android.content.Context

class TokenStore(context: Context) {
    private val prefs = context.getSharedPreferences("aimemo_prefs", Context.MODE_PRIVATE)

    fun loadToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun clearToken() {
        prefs.edit().remove(KEY_TOKEN).apply()
    }

    companion object {
        private const val KEY_TOKEN = "aimemo_token"
    }
}
