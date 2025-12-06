import { Lesson, CEFRLevel } from './types';

export const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export const LESSON_DATA: Record<CEFRLevel, Lesson[]> = {
  'A1': [
    { id: 'a1-1', level: 'A1', sentence: "Hello, how are you today?", translation: "Merhaba, bugün nasılsın?" },
    { id: 'a1-2', level: 'A1', sentence: "My name is John and I am a student.", translation: "Benim adım John ve ben bir öğrenciyim." },
    { id: 'a1-3', level: 'A1', sentence: "I like to eat apples.", translation: "Elma yemeyi severim." }
  ],
  'A2': [
    { id: 'a2-1', level: 'A2', sentence: "I am going to the cinema tomorrow.", translation: "Yarın sinemaya gideceğim." },
    { id: 'a2-2', level: 'A2', sentence: "Can you help me with my homework?", translation: "Ödevimde bana yardım edebilir misin?" }
  ],
  'B1': [
    { id: 'b1-1', level: 'B1', sentence: "I have been working here for two years.", translation: "İki yıldır burada çalışıyorum." },
    { id: 'b1-2', level: 'B1', sentence: "If I had more money, I would travel the world.", translation: "Daha fazla param olsaydı dünyayı gezerdim." }
  ],
  'B2': [
    { id: 'b2-1', level: 'B2', sentence: "I would like to schedule a meeting for next week.", translation: "Gelecek hafta için bir toplantı planlamak istiyorum." },
    { id: 'b2-2', level: 'B2', sentence: "Despite the bad weather, we enjoyed our trip.", translation: "Kötü havaya rağmen gezimizden keyif aldık." }
  ],
  'C1': [
    { id: 'c1-1', level: 'C1', sentence: "The implications of this discovery are far-reaching.", translation: "Bu keşfin sonuçları çok geniş kapsamlıdır." },
    { id: 'c1-2', level: 'C1', sentence: "It is imperative that we address this issue immediately.", translation: "Bu konuyu derhal ele almamız zorunludur." }
  ]
};