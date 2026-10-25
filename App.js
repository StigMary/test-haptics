import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Calendar from 'expo-calendar';

const RED = '#ff453a';
const GREEN = '#30d158';

const UI_ACTIVE_BG = '#2c2c30';
const UI_ACTIVE_BORDER = 'rgba(255,255,255,0.35)';

const MONTHS = [
  'ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ',
  'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ',
];
const WEEKDAYS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];

function yearStats() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeap ? 366 : 365;
  const dayOfYear = Math.round((Date.UTC(year, month, today) - Date.UTC(year, 0, 1)) / 86400000) + 1;
  const daysLeft = totalDays - dayOfYear;
  const progress = Math.min(Math.max(dayOfYear / totalDays, 0), 1);
  const percent = (progress * 100).toFixed(1).replace('.', ',');
  return { now, year, month, today, totalDays, dayOfYear, daysLeft, progress, percent };
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yStart) / 86400000 + 1) / 7);
}

function LockCircleRing({ progress, dayOfYear }) {
  const segments = 60;
  const activeSegments = Math.round(segments * progress);
  const radius = 26;

  return (
    <View style={{ width: 64, height: 64, justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * 2 * Math.PI - Math.PI / 2;
        const x = 32 + radius * Math.cos(angle) - 3;
        const y = 32 + radius * Math.sin(angle) - 3;
        const isFilled = i <= activeSegments;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: isFilled ? '#ffffff' : 'rgba(255,255,255,0.22)',
            }}
          />
        );
      })}
      <Text style={styles.lockCircleNum}>{dayOfYear}</Text>
    </View>
  );
}

export default function App() {
  const d = useMemo(() => yearStats(), []);

  const [sizeMode, setSizeMode] = useState('medium');
  const [styleMode, setStyleMode] = useState(1);
  
  const [eventDots, setEventDots] = useState(true);
  const [skipAllDay, setSkipAllDay] = useState(false);
  const [monthAccent, setMonthAccent] = useState(false);
  const [barAccent, setBarAccent] = useState(false);
  const [showYear, setShowYear] = useState(true);
  const [showProgressText, setShowProgressText] = useState(true);
  
  const [eventDays, setEventDays] = useState(new Set());

  const isLockWidget = sizeMode.startsWith('lock_');
  const clear = styleMode === 6;
  const activeStyle = clear ? 1 : styleMode;

  useEffect(() => {
    if (!eventDots || activeStyle !== 1 || isLockWidget) return;
    (async () => {
      try {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') return;
        const start = new Date(d.year, d.month, 1);
        const end = new Date(d.year, d.month + 1, 0, 23, 59, 59);
        const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const events = await Calendar.getEventsAsync(cals.map(c => c.id), start, end);
        const days = new Set();

        for (const e of events) {
          if (skipAllDay && e.allDay) continue;
          const cur = new Date(Math.max(new Date(e.startDate), start));
          cur.setHours(0, 0, 0, 0);
          const last = new Date(Math.min(new Date(e.endDate), end) - 1);
          while (cur <= last) {
            if (cur.getMonth() === d.month) days.add(cur.getDate());
            cur.setDate(cur.getDate() + 1);
          }
        }
        setEventDays(days);
      } catch (e) {}
    })();
  }, [d.year, d.month, eventDots, skipAllDay, activeStyle, isLockWidget]);

  const firstDayIndex = (new Date(d.year, d.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(d.year, d.month + 1, 0).getDate();
  const daysInPrev = new Date(d.year, d.month, 0).getDate();
  const rows = Math.ceil((firstDayIndex + daysInMonth) / 7);
  const todayRow = Math.floor((firstDayIndex + d.today - 1) / 7);

  const C = clear
    ? {
        month: '#ffffff',
        year: 'rgba(255,255,255,0.8)',
        wd: 'rgba(255,255,255,0.85)',
        wdWe: 'rgba(255,255,255,0.65)',
        num: '#ffffff',
        we: 'rgba(255,255,255,0.85)',
        out: 'rgba(255,255,255,0.4)',
        cap: '#ffffff',
        remain: 'rgba(255,255,255,0.95)',
        fill: '#ffffff',
        track: 'rgba(255,255,255,0.3)',
        dot: 'rgba(255,255,255,0.85)',
      }
    : {
        month: 'rgba(255,255,255,0.98)',
        year: 'rgba(255,255,255,0.5)',
        wd: '#aeaeb2',
        wdWe: '#636366',
        num: 'rgba(255,255,255,0.95)',
        we: '#aeaeb2',
        out: 'rgba(255,255,255,0.2)',
        cap: '#c7c7cc',
        remain: '#e5e5ea',
        fill: 'rgba(255,255,255,0.9)',
        track: 'rgba(255,255,255,0.18)',
        dot: '#aeaeb2',
      };

  const monthColor = activeStyle === 1 && !monthAccent ? C.month : RED;
  const barColor = activeStyle === 2 ? GREEN : barAccent ? RED : C.fill;
  const remColor = activeStyle === 2 ? GREEN : barAccent ? RED : C.remain;
  const trackColor = activeStyle === 2 ? 'rgba(255,255,255,0.2)' : C.track;

  const getWidgetBg = () => {
    if (clear) {
      return {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderColor: 'rgba(255,255,255,0.28)',
        borderWidth: 1,
      };
    }
    return {
      backgroundColor: activeStyle === 1 ? '#000000' : '#141419',
    };
  };

  const renderGrid = (K = 1, circleSize = 20, fontSize = 13) => (
    <View style={styles.gridContainer}>
      <View style={styles.gridRow}>
        {activeStyle === 2 && <View style={{ width: 20 * K }} />}
        {WEEKDAYS.map((w, c) => (
          <Text
            key={c}
            style={[
              styles.wdText,
              {
                fontSize: 11 * K,
                color: activeStyle === 1 && c > 4 ? C.wdWe : C.wd,
              },
            ]}
          >
            {w}
          </Text>
        ))}
      </View>

      {Array.from({ length: rows }).map((_, r) => {
        const monday = new Date(d.year, d.month, 1 - firstDayIndex + r * 7);
        const wk = isoWeek(monday);
        const isTodayRow = activeStyle === 2 && r === todayRow;

        return (
          <View
            key={r}
            style={[
              styles.gridRow,
              isTodayRow && {
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: 6 * K,
              },
              { flex: 1 },
            ]}
          >
            {activeStyle === 2 && (
              <Text style={[styles.weekNum, { width: 20 * K, fontSize: 10 * K }]}>
                {wk}
              </Text>
            )}
            {Array.from({ length: 7 }).map((__, c) => {
              const dayNum = r * 7 + c - firstDayIndex + 1;
              const out = dayNum < 1 || dayNum > daysInMonth;
              const label =
                dayNum < 1
                  ? daysInPrev + dayNum
                  : dayNum > daysInMonth
                  ? dayNum - daysInMonth
                  : dayNum;
              const isToday = !out && dayNum === d.today;
              const hasDot = activeStyle === 1 && eventDots && !out && eventDays.has(dayNum);

              let color = C.num;
              if (out) color = C.out;
              else if (c > 4) color = C.we;

              return (
                <View key={c} style={styles.dayCell}>
                  {activeStyle === 1 ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <View
                        style={[
                          styles.dayCircle,
                          { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
                          isToday && { backgroundColor: RED },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: fontSize,
                            fontWeight: isToday ? '700' : clear ? '600' : '500',
                            color: isToday ? '#ffffff' : color,
                          }}
                        >
                          {label}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: 3.5,
                          height: 3.5,
                          borderRadius: 1.75,
                          backgroundColor: hasDot ? C.dot : 'transparent',
                          marginTop: 1,
                        }}
                      />
                    </View>
                  ) : (
                    <Text
                      style={{
                        fontSize: fontSize,
                        fontWeight: isToday ? '700' : '500',
                        color: isToday ? RED : color,
                      }}
                    >
                      {label}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>LockDay</Text>
        <Text style={styles.headerSubtitle}>Студия кастомизации виджетов</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.stage, (clear || isLockWidget) && styles.stageGlassBg]}>
          <Text style={styles.stageTitle}>
            {isLockWidget ? 'ЭКРАН БЛОКИРОВКИ iOS' : 'ДОМАШНИЙ ЭКРАН iOS'}
          </Text>

          {sizeMode === 'small' && (
            <View style={[styles.widgetSmall, getWidgetBg()]}>
              <View style={styles.rowBetweenBaseline}>
                <Text style={[styles.monthText, { color: monthColor, fontSize: 13 }]}>
                  {MONTHS[d.month]}
                </Text>
                {showYear && <Text style={[styles.yearText, { color: C.year, fontSize: 11 }]}>{d.year}</Text>}
              </View>

              <View style={{ flex: 1, marginVertical: 4 }}>{renderGrid(0.95, 20, 12.5)}</View>

              {activeStyle === 1 ? (
                <View style={{ marginTop: 2 }}>
                  {showProgressText && (
                    <View style={styles.rowBetween}>
                      <Text style={[styles.capText, { color: C.cap, fontSize: 9 }]}>
                        ДЕНЬ {d.dayOfYear} ({d.percent}%)
                      </Text>
                      <Text style={[styles.capText, { color: remColor, fontSize: 9 }]}>
                        ОСТ. {d.daysLeft} ДН
                      </Text>
                    </View>
                  )}
                  <View style={[styles.barTrack, { height: 4, backgroundColor: trackColor }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${d.progress * 100}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </View>
              ) : (
                <View style={[styles.style2BottomBox, { padding: 6, marginTop: 2 }]}>
                  {showProgressText && (
                    <View style={styles.rowBetween}>
                      <Text style={[styles.capText, { color: '#aeaeb2', fontSize: 9 }]}>
                        ДЕНЬ {d.dayOfYear} ({d.percent}%)
                      </Text>
                      <Text style={[styles.capText, { color: GREEN, fontSize: 9 }]}>
                        {d.daysLeft} ДН
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.barTrack,
                      { height: 4, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 3 },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        { width: `${d.progress * 100}%`, backgroundColor: GREEN },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {sizeMode === 'medium' && (
            <View style={[styles.widgetMedium, getWidgetBg()]}>
              <View style={[styles.medLeftPanel, activeStyle === 2 && styles.medLeftPanelBox]}>
                <View>
                  <Text style={[styles.monthText, { color: monthColor, fontSize: 14.5 }]}>
                    {MONTHS[d.month]}
                  </Text>
                  {showYear && (
                    <Text style={[styles.yearText, { color: C.year, fontSize: 11, marginTop: 2 }]}>
                      {d.year}
                    </Text>
                  )}
                  <Text style={[styles.medBigNum, { color: C.num }]}>{d.dayOfYear}</Text>
                  <Text style={[styles.capText, { color: C.cap, marginTop: 2, fontSize: 9 }]}>
                    ДЕНЬ ГОДА ИЗ {d.totalDays}
                  </Text>
                </View>

                <View>
                  {showProgressText && (
                    <View style={styles.rowBetween}>
                      <Text style={[styles.capText, { color: C.cap, fontSize: 9 }]}>{d.percent}%</Text>
                      <Text style={[styles.capText, { color: remColor, fontSize: 9 }]}>
                        ОСТ. {d.daysLeft} ДН
                      </Text>
                    </View>
                  )}
                  <View style={[styles.barTrack, { height: 4, backgroundColor: trackColor }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${d.progress * 100}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.medRightGrid}>{renderGrid(1.05, 22, 13.5)}</View>
            </View>
          )}

          {sizeMode === 'large' && (
            <View style={[styles.widgetLarge, getWidgetBg()]}>
              <View style={styles.rowBetweenBaseline}>
                <Text style={[styles.monthText, { color: monthColor, fontSize: 19 }]}>
                  {MONTHS[d.month]}
                </Text>
                {showYear && <Text style={[styles.yearText, { color: C.year, fontSize: 15 }]}>{d.year}</Text>}
              </View>

              <View style={{ flex: 1, marginVertical: 12 }}>{renderGrid(1.5, 30, 16)}</View>

              {activeStyle === 1 ? (
                <View>
                  {showProgressText && (
                    <View style={styles.rowBetween}>
                      <Text style={[styles.capText, { color: C.cap, fontSize: 12 }]}>
                        ДЕНЬ {d.dayOfYear} ({d.percent}%)
                      </Text>
                      <Text style={[styles.capText, { color: remColor, fontSize: 12 }]}>
                        ОСТ. {d.daysLeft} ДН
                      </Text>
                    </View>
                  )}
                  <View style={[styles.barTrack, { height: 6, backgroundColor: trackColor }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${d.progress * 100}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </View>
              ) : (
                <View style={[styles.style2BottomBox, { padding: 12, borderRadius: 14 }]}>
                  {showProgressText && (
                    <View style={styles.rowBetween}>
                      <Text style={[styles.capText, { color: '#aeaeb2', fontSize: 12 }]}>
                        ДЕНЬ {d.dayOfYear} ({d.percent}%)
                      </Text>
                      <Text style={[styles.capText, { color: GREEN, fontSize: 12 }]}>
                        {d.daysLeft} ДН
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.barTrack,
                      { height: 6, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 6 },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        { width: `${d.progress * 100}%`, backgroundColor: GREEN },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {sizeMode === 'lock_circle' && (
            <View style={styles.lockPreviewCenter}>
              <LockCircleRing progress={d.progress} dayOfYear={d.dayOfYear} />
              <Text style={styles.lockHint}>Круглый виджет (64×64 pt)</Text>
            </View>
          )}

          {sizeMode === 'lock_rect' && (
            <View style={styles.lockPreviewCenter}>
              <View style={styles.lockRectBox}>
                <Text style={styles.lockRectT1}>
                  {MONTHS[d.month]} · ДЕНЬ {d.dayOfYear}
                </Text>
                <View style={styles.lockRectBarTrack}>
                  <View style={[styles.lockRectBarFill, { width: `${d.progress * 100}%` }]} />
                </View>
                <Text style={styles.lockRectT2}>
                  {d.percent}% · ОСТ. {d.daysLeft} ДН
                </Text>
              </View>
              <Text style={styles.lockHint}>Прямоугольный виджет под часами</Text>
            </View>
          )}

          {sizeMode === 'lock_inline' && (
            <View style={styles.lockPreviewCenter}>
              <View style={styles.lockInlineMock}>
                <Text style={styles.lockInlineText}>
                  День {d.dayOfYear} · {d.percent}%
                </Text>
                <Text style={styles.lockClockMock}>09:41</Text>
              </View>
              <Text style={styles.lockHint}>Верхняя строка над часами (accessoryInline)</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeader}>ДОМАШНИЙ ЭКРАН</Text>
        <View style={styles.optionsGrid}>
          {[
            { id: 'small', label: 'Малый (2×2)' },
            { id: 'medium', label: 'Средний (4×2)' },
            { id: 'large', label: 'Большой (4×4)' },
          ].map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.optionBtn, sizeMode === item.id && styles.optionBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setSizeMode(item.id);
              }}
            >
              <Text style={[styles.optionText, sizeMode === item.id && styles.optionTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionHeader}>ЭКРАН БЛОКИРОВКИ</Text>
        <View style={styles.optionsGrid}>
          {[
            { id: 'lock_circle', label: 'Круг' },
            { id: 'lock_rect', label: 'Прямоугольник' },
            { id: 'lock_inline', label: 'Верхняя строка' },
          ].map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.optionBtn, sizeMode === item.id && styles.optionBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setSizeMode(item.id);
              }}
            >
              <Text style={[styles.optionText, sizeMode === item.id && styles.optionTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!isLockWidget ? (
          <>
            <Text style={styles.sectionHeader}>СТИЛЬ ВИДЖЕТА</Text>
            <View style={styles.optionsGrid}>
              {[
                { id: 1, label: '1 · Минимализм' },
                { id: 2, label: '2 · С номерами недель' },
                { id: 6, label: '6 · Прозрачный (Liquid Glass)' },
              ].map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.optionBtn, styleMode === item.id && styles.optionBtnActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setStyleMode(item.id);
                  }}
                >
                  <Text
                    style={[styles.optionText, styleMode === item.id && styles.optionTextActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionHeader}>ЭЛЕМЕНТЫ И КАСТОМИЗАЦИЯ</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Отображать год (справа от месяца)</Text>
                <Switch
                  value={showYear}
                  onValueChange={v => {
                    Haptics.selectionAsync();
                    setShowYear(v);
                  }}
                  trackColor={{ false: '#2c2c30', true: '#636366' }}
                />
              </View>

              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Текст прогресса и остатка дней</Text>
                <Switch
                  value={showProgressText}
                  onValueChange={v => {
                    Haptics.selectionAsync();
                    setShowProgressText(v);
                  }}
                  trackColor={{ false: '#2c2c30', true: '#636366' }}
                />
              </View>

              {activeStyle === 1 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Точки под датами с событиями</Text>
                    <Switch
                      value={eventDots}
                      onValueChange={v => {
                        Haptics.selectionAsync();
                        setEventDots(v);
                      }}
                      trackColor={{ false: '#2c2c30', true: '#636366' }}
                    />
                  </View>

                  {eventDots && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Скрывать события «Весь день»</Text>
                        <Switch
                          value={skipAllDay}
                          onValueChange={v => {
                            Haptics.selectionAsync();
                            setSkipAllDay(v);
                          }}
                          trackColor={{ false: '#2c2c30', true: '#636366' }}
                        />
                      </View>
                    </>
                  )}

                  <View style={styles.divider} />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Название месяца красным</Text>
                    <Switch
                      value={monthAccent}
                      onValueChange={v => {
                        Haptics.selectionAsync();
                        setMonthAccent(v);
                      }}
                      trackColor={{ false: '#2c2c30', true: '#636366' }}
                    />
                  </View>

                  <View style={styles.divider} />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Красная полоса и остаток дней</Text>
                    <Switch
                      value={barAccent}
                      onValueChange={v => {
                        Haptics.selectionAsync();
                        setBarAccent(v);
                      }}
                      trackColor={{ false: '#2c2c30', true: '#636366' }}
                    />
                  </View>
                </>
              )}
            </View>
          </>
        ) : (
          <View style={styles.lockInfoCard}>
            <Text style={styles.lockInfoText}>
              Виджеты экрана блокировки рендерятся в одноцветном режиме — iOS автоматически окрашивает их под стиль твоих часов и обоев.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 13, color: '#8e8e93', marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  stage: {
    backgroundColor: '#141418',
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginTop: 4,
  },
  stageGlassBg: { backgroundColor: '#1c2536', borderColor: 'rgba(255,255,255,0.12)' },
  stageTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 12,
  },
  widgetSmall: {
    width: 168,
    height: 168,
    borderRadius: 22,
    padding: 12,
    justifyContent: 'space-between',
  },
  widgetMedium: {
    width: 348,
    height: 168,
    borderRadius: 22,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  widgetLarge: {
    width: 348,
    height: 362,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
  },
  rowBetweenBaseline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  monthText: { fontWeight: '700' },
  yearText: { fontWeight: '700' },
  capText: { fontWeight: '700' },
  barTrack: { borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  style2BottomBox: {
    backgroundColor: '#1c1c22',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  medLeftPanel: { width: 124, justifyContent: 'space-between' },
  medLeftPanelBox: {
    backgroundColor: '#1c1c22',
    borderRadius: 14,
    padding: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  medBigNum: { fontSize: 42, fontWeight: '700', lineHeight: 46, marginTop: 2 },
  medRightGrid: { flex: 1, marginLeft: 12 },
  gridContainer: { flex: 1, justifyContent: 'space-between' },
  gridRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wdText: { flex: 1, textAlign: 'center', fontWeight: '700' },
  weekNum: { color: '#8e8e93', textAlign: 'center', fontWeight: '600' },
  dayCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { alignItems: 'center', justifyContent: 'center' },
  lockPreviewCenter: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  lockCircleNum: { color: '#ffffff', fontSize: 19, fontWeight: '700' },
  lockRectBox: { width: 160 },
  lockRectT1: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  lockRectBarTrack: {
    width: 150,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 5,
    overflow: 'hidden',
  },
  lockRectBarFill: { height: '100%', backgroundColor: '#ffffff', borderRadius: 3 },
  lockRectT2: { color: '#ffffff', fontSize: 11, fontWeight: '500' },
  lockInlineMock: { alignItems: 'center' },
  lockInlineText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  lockClockMock: { color: 'rgba(255,255,255,0.85)', fontSize: 56, fontWeight: '700', lineHeight: 62 },
  lockHint: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 14 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#636366',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    backgroundColor: '#16161a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionBtnActive: { backgroundColor: UI_ACTIVE_BG, borderColor: UI_ACTIVE_BORDER },
  optionText: { color: '#8e8e93', fontSize: 13, fontWeight: '600' },
  optionTextActive: { color: '#ffffff' },
  card: {
    backgroundColor: '#16161a',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  switchLabel: { color: '#e5e5ea', fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  lockInfoCard: {
    backgroundColor: '#16161a',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  lockInfoText: { color: '#8e8e93', fontSize: 13, lineHeight: 18 },
});