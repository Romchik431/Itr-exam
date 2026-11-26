package by.exampro.itr;

import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.Build;
import java.util.Calendar;

public final class StudyReminder extends BroadcastReceiver {
    static final String CHANNEL = "daily_study";
    private static final String ALARM = "by.exampro.itr.DAILY";
    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("reminders", Context.MODE_PRIVATE);
    }
    static boolean allowed(Context c) {
        NotificationManager manager = c.getSystemService(NotificationManager.class);
        NotificationChannel channel = manager.getNotificationChannel(CHANNEL);
        return manager.areNotificationsEnabled() && (channel == null || channel.getImportance() != NotificationManager.IMPORTANCE_NONE)
                && (Build.VERSION.SDK_INT < 33 || c.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED);
    }
    static void schedule(Context c) {
        SharedPreferences p = prefs(c);
        AlarmManager manager = c.getSystemService(AlarmManager.class);
        PendingIntent alarm = PendingIntent.getBroadcast(c, 11, new Intent(c, StudyReminder.class).setAction(ALARM), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        manager.cancel(alarm);
        if (!p.getBoolean("enabled", false) || !allowed(c)) return;
        Calendar next = Calendar.getInstance();
        next.set(Calendar.HOUR_OF_DAY, p.getInt("hour", 19));
        next.set(Calendar.MINUTE, p.getInt("minute", 0));
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);
        if (next.getTimeInMillis() <= System.currentTimeMillis()) next.add(Calendar.DATE, 1);
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), alarm);
    }
    @Override public void onReceive(Context c, Intent intent) {
        if (ALARM.equals(intent.getAction()) && prefs(c).getBoolean("enabled", false) && allowed(c)) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Подготовка к экзамену", NotificationManager.IMPORTANCE_DEFAULT));
            PendingIntent open = PendingIntent.getActivity(c, 12, new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            nm.notify(19, new Notification.Builder(c, CHANNEL).setSmallIcon(R.drawable.notify).setContentTitle("Время для подготовки")
                    .setContentText("Откройте свой план и повторите вопросы на сегодня.").setContentIntent(open).setAutoCancel(true).build());
        }
        schedule(c);
    }
}
