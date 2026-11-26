package by.exampro.itr;

import android.app.*;
import android.content.*;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.print.PrintManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.util.AtomicFile;
import android.view.*;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final String HOST = "exam.invalid";
    private static final int MAX = 24 * 1024 * 1024, OPEN = 71, CREATE = 72, NOTIFY = 73;
    private static final Set<String> FILES = new HashSet<>(Arrays.asList("index.html", "style.css", "core.js", "ui.js", "builtin.json"));
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private WebView web;
    private AtomicFile data, beforeImport;
    private boolean webReady, resumed, ttsReady;
    private String importType = "", pendingScript = "", voiceText = "";
    private float voiceRate = 1;
    private TextToSpeech tts;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        data = new AtomicFile(new File(getFilesDir(), "study-v1.json"));
        beforeImport = new AtomicFile(new File(getFilesDir(), "before-import.json"));
        if (saved != null) importType = saved.getString("importType", "");
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(20, 73, 67));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(247, 249, 247));
        root.addView(web);
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets sys = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                v.setPadding(sys.left, sys.top, sys.right, sys.bottom);
                return WindowInsets.CONSUMED;
            });
        }
        setContentView(root);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBlockNetworkLoads(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        configureText();
        WebView.setWebContentsDebuggingEnabled(false);
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri uri = r.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && "GET".equals(r.getMethod())) {
                    String path = uri.getPath();
                    String file = path == null || !path.startsWith("/app/") ? "" : path.substring(5);
                    if (FILES.contains(file)) {
                        String mime = file.endsWith(".js") ? "application/javascript" : file.endsWith(".css") ? "text/css" : file.endsWith(".json") ? "application/json" : "text/html";
                        try { return new WebResourceResponse(mime, "UTF-8", getAssets().open(file)); }
                        catch (IOException ignored) { }
                    }
                }
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) { return true; }
        });
        web.addJavascriptInterface(new Bridge(), "Device");
        web.loadUrl("https://" + HOST + "/app/index.html");
    }
    private void configureText() { web.getSettings().setTextZoom(Math.round(100 * getResources().getConfiguration().fontScale)); }
    @Override public void onConfigurationChanged(Configuration config) {
        super.onConfigurationChanged(config);
        configureText();
        script("window.systemChanged&&systemChanged()");
    }
    private static String literal(String s) { return JSONObject.quote(s).replace("\u2028","\\u2028").replace("\u2029","\\u2029"); }
    private void script(String js) {
        runOnUiThread(() -> {
            if (isFinishing() || isDestroyed()) return;
            if (!webReady) { pendingScript = pendingScript + js + ";"; return; }
            web.evaluateJavascript(js, null);
        });
    }
    private void toast(String s) { runOnUiThread(() -> Toast.makeText(this, s, Toast.LENGTH_LONG).show()); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); out.putString("importType", importType); }
    @Override protected void onPause() {
        resumed = false;
        if (webReady) web.evaluateJavascript("window.sessionFocus&&sessionFocus(false)", null);
        if (tts != null) { tts.stop(); voiceText = ""; }
        super.onPause();
    }
    @Override protected void onResume() { super.onResume(); resumed = true; if (webReady) script("window.sessionFocus&&sessionFocus(true)"); }
    @Override public void onBackPressed() {
        if (!webReady) { super.onBackPressed(); return; }
        web.evaluateJavascript("window.appBack&&appBack()", result -> {
            if (!"true".equals(result)) MainActivity.super.onBackPressed();
        });
    }
    @Override protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        io.shutdown(); web.removeJavascriptInterface("Device"); web.destroy(); super.onDestroy();
    }
    private static byte[] bytes(InputStream input) throws IOException {
        if (input == null) throw new IOException("Документ недоступен");
        try (InputStream in = input; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) != -1) {
                if (out.size() + n > MAX) throw new IOException("Файл превышает 24 МиБ");
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }
    private static void atomic(AtomicFile file, byte[] value) throws IOException {
        FileOutputStream stream = file.startWrite();
        try { stream.write(value); file.finishWrite(stream); }
        catch (IOException e) { file.failWrite(stream); throw e; }
    }
    private void readDocument(Uri uri, String type) {
        io.execute(() -> {
            try {
                String body = new String(bytes(getContentResolver().openInputStream(uri)), StandardCharsets.UTF_8);
                script("window.receiveDocument(" + literal(type) + "," + literal(body) + ")");
            } catch (Exception e) { toast("Не удалось прочитать файл. " + e.getMessage()); }
        });
    }
    @Override protected void onActivityResult(int req, int result, Intent intent) {
        super.onActivityResult(req, result, intent);
        if (result != RESULT_OK || intent == null || intent.getData() == null) return;
        Uri uri = intent.getData();
        if (!"content".equals(uri.getScheme())) { toast("Выберите файл через системный список документов."); return; }
        if (req == OPEN) readDocument(uri, importType);
        if (req == CREATE) io.execute(() -> {
            try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new IOException();
                out.write(bytes(new FileInputStream(new File(getCacheDir(), "outgoing"))));
                toast("Файл сохранён");
            } catch (Exception e) { toast("Сохранение не завершено. Проверьте свободное место и повторите."); }
        });
    }
    private void choose(Intent intent, int code) {
        try { startActivityForResult(intent.addCategory(Intent.CATEGORY_OPENABLE), code); }
        catch (ActivityNotFoundException e) { toast("Системный выбор файлов недоступен."); }
    }
    private void speakReady() {
        if (!ttsReady || voiceText.isEmpty() || !resumed) return;
        Voice selected = null;
        Set<Voice> voices = tts.getVoices();
        if (voices != null) for (Voice v : voices) {
            if ("ru".equals(v.getLocale().getLanguage()) && !v.isNetworkConnectionRequired() && (v.getFeatures() == null || !v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED))) { selected = v; break; }
        }
        if (selected == null || tts.setVoice(selected) == TextToSpeech.ERROR) { toast("В системном синтезаторе речи отсутствует локальный русский голос."); return; }
        tts.setSpeechRate(voiceRate); tts.stop();
        int limit = TextToSpeech.getMaxSpeechInputLength() - 10;
        for (int at = 0; at < voiceText.length(); at += limit)
            tts.speak(voiceText.substring(at, Math.min(at + limit, voiceText.length())), TextToSpeech.QUEUE_ADD, null, "study-" + at);
        voiceText = "";
    }
    private void updateReminder(boolean enabled, int hour, int minute) {
        StudyReminder.prefs(this).edit().putBoolean("enabled", enabled).putInt("hour", hour).putInt("minute", minute).apply();
        if (enabled && Build.VERSION.SDK_INT >= 33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, NOTIFY); return;
        }
        StudyReminder.schedule(this);
        script("window.reminderChanged&&reminderChanged()");
    }
    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] grants) {
        super.onRequestPermissionsResult(code, permissions, grants);
        if (code == NOTIFY) {
            if (!StudyReminder.allowed(this)) { StudyReminder.prefs(this).edit().putBoolean("enabled", false).apply(); toast("Напоминания выключены. Разрешение можно изменить в настройках приложения."); }
            StudyReminder.schedule(this); script("window.reminderChanged&&reminderChanged()");
        }
    }
    public final class Bridge {
        @JavascriptInterface public void ready() {
            runOnUiThread(() -> { webReady = true; String queued = pendingScript; pendingScript = ""; if (!queued.isEmpty()) web.evaluateJavascript(queued, null); });
        }
        @JavascriptInterface public synchronized String loadState() {
            try { return new String(bytes(data.openRead()), StandardCharsets.UTF_8); }
            catch (FileNotFoundException e) { return ""; } catch (IOException e) { return "!"; }
        }
        @JavascriptInterface public synchronized boolean saveState(String json) {
            try {
                byte[] value = json.getBytes(StandardCharsets.UTF_8);
                if (value.length > MAX || !json.startsWith("{")) return false;
                atomic(data, value); return true;
            } catch (IOException e) { return false; }
        }
        @JavascriptInterface public synchronized boolean checkpoint() {
            try {
                atomic(beforeImport, bytes(data.openRead())); return true;
            } catch (FileNotFoundException e) { return true; } catch (IOException e) { return false; }
        }
        @JavascriptInterface public String restorePoint() {
            try { return new String(bytes(beforeImport.openRead()), StandardCharsets.UTF_8); } catch (IOException e) { return ""; }
        }
        @JavascriptInterface public void openDocument(String type) {
            if (!"bank".equals(type) && !"backup".equals(type)) return;
            runOnUiThread(() -> { importType = type; choose(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*"), OPEN); });
        }
        @JavascriptInterface public void exportFile(String name, String json) {
            try {
                byte[] value = json.getBytes(StandardCharsets.UTF_8);
                if (value.length > MAX) throw new IOException();
                atomic(new AtomicFile(new File(getCacheDir(), "outgoing")), value);
                String safe = name.replaceAll("[^A-Za-z0-9._-]", "_");
                runOnUiThread(() -> choose(new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").putExtra(Intent.EXTRA_TITLE, safe), CREATE));
            } catch (IOException e) { toast("Не удалось подготовить файл для сохранения."); }
        }
        @JavascriptInterface public boolean systemDark() { return (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES; }
        @JavascriptInterface public void remind(boolean enabled, int hour, int minute) {
            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) runOnUiThread(() -> updateReminder(enabled, hour, minute));
        }
        @JavascriptInterface public String reminder() {
            SharedPreferences p = StudyReminder.prefs(MainActivity.this);
            return (p.getBoolean("enabled", false) && StudyReminder.allowed(MainActivity.this) ? "1" : "0") + "," + p.getInt("hour", 19) + "," + p.getInt("minute", 0);
        }
        @JavascriptInterface public void speak(String text, double rate) {
            runOnUiThread(() -> {
                voiceText = text.substring(0, Math.min(60000, text.length())); voiceRate = (float)Math.max(0.6, Math.min(1.6, rate));
                if (tts == null) {
                    tts = new TextToSpeech(MainActivity.this, status -> { ttsReady = status == TextToSpeech.SUCCESS; if (ttsReady) speakReady(); else toast("Системный синтезатор речи недоступен."); });
                } else if (ttsReady) speakReady(); else toast("Синтезатор речи ещё не готов.");
            });
        }
        @JavascriptInterface public void silence() { runOnUiThread(() -> { voiceText = ""; if (tts != null) tts.stop(); }); }
        @JavascriptInterface public void copy(String text) { runOnUiThread(() -> { ((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("Вопрос", text)); toast("Текст скопирован"); }); }
        @JavascriptInterface public void share(String text) {
            runOnUiThread(() -> startActivity(Intent.createChooser(new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), "Поделиться результатом")));
        }
        @JavascriptInterface public void printReport() {
            runOnUiThread(() -> ((PrintManager)getSystemService(PRINT_SERVICE)).print("Экзамен ПРО — результат", web.createPrintDocumentAdapter("Экзамен ПРО"), null));
        }
        @JavascriptInterface public void source(String url) {
            Uri uri = Uri.parse(url);
            if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) return;
            runOnUiThread(() -> new AlertDialog.Builder(MainActivity.this).setTitle("Открыть источник в браузере?")
                    .setMessage(uri.getHost() + "\nДля просмотра источника потребуется интернет.").setNegativeButton("Отмена", null)
                    .setPositiveButton("Открыть", (d,w) -> { try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); } catch (ActivityNotFoundException e) { toast("Браузер недоступен."); } }).show());
        }
    }
}
