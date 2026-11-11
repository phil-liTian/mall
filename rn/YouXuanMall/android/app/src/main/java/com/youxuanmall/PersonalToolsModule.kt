package com.youxuanmall

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.provider.AlarmClock
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PersonalToolsModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName(): String = "PersonalTools"

  private val preferences
    get() = reactApplicationContext.getSharedPreferences("personal_tools", Context.MODE_PRIVATE)

  private val sessionPreferences
    get() = reactApplicationContext.getSharedPreferences("mall_session", Context.MODE_PRIVATE)

  @ReactMethod
  fun loadSession(promise: Promise) {
    try {
      promise.resolve(sessionPreferences.getString("session", "") ?: "")
    } catch (error: Exception) {
      promise.reject("LOAD_SESSION_FAILED", "无法读取登录状态", error)
    }
  }

  @ReactMethod
  fun saveSession(serialized: String, promise: Promise) {
    try {
      val editor = sessionPreferences.edit()
      if (serialized.isEmpty()) editor.remove("session") else editor.putString("session", serialized)
      if (editor.commit()) promise.resolve(null)
      else promise.reject("SAVE_SESSION_FAILED", "无法保存登录状态")
    } catch (error: Exception) {
      promise.reject("SAVE_SESSION_FAILED", "无法保存登录状态", error)
    }
  }

  @ReactMethod
  fun loadTodos(promise: Promise) {
    try {
      promise.resolve(preferences.getString("todos", "[]") ?: "[]")
    } catch (error: Exception) {
      promise.reject("LOAD_TODOS_FAILED", "无法读取待办", error)
    }
  }

  @ReactMethod
  fun saveTodos(serialized: String, promise: Promise) {
    try {
      if (preferences.edit().putString("todos", serialized).commit()) promise.resolve(null)
      else promise.reject("SAVE_TODOS_FAILED", "无法保存待办")
    } catch (error: Exception) {
      promise.reject("SAVE_TODOS_FAILED", "无法保存待办", error)
    }
  }

  @ReactMethod
  fun openAlarm(hour: Int, minute: Int, message: String, promise: Promise) {
    if (hour !in 0..23 || minute !in 0..59) {
      promise.reject("INVALID_TIME", "闹钟时间无效")
      return
    }
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "当前没有可用页面")
      return
    }
    try {
      val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
        putExtra(AlarmClock.EXTRA_HOUR, hour)
        putExtra(AlarmClock.EXTRA_MINUTES, minute)
        putExtra(AlarmClock.EXTRA_MESSAGE, message)
      }
      activity.startActivity(intent)
      promise.resolve(null)
    } catch (error: ActivityNotFoundException) {
      promise.reject("NO_ALARM_APP", "手机上没有可用的闹钟应用", error)
    } catch (error: SecurityException) {
      promise.reject("ALARM_PERMISSION_DENIED", "无法打开系统闹钟", error)
    }
  }
}
