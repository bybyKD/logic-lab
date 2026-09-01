import type { LanguageId } from './languages'

/** Returns the four-language "Conditional Logic" example with the age filled in. */
export function ageExample(age: number): Record<LanguageId, string> {
  return {
    python: `# Mengecek apakah umur sudah cukup
age = ${age}

if age >= 18:
    print("Dewasa")`,
    java: `// Mengecek apakah umur sudah cukup
int age = ${age};

if (age >= 18) {
    System.out.println("Dewasa");
}`,
    go: `// Mengecek apakah umur sudah cukup
age := ${age}

if age >= 18 {
    fmt.Println("Dewasa")
}`,
    c: `// Mengecek apakah umur sudah cukup
int age = ${age};

if (age >= 18) {
    printf("Dewasa");
}`,
  }
}

export const LANGUAGE_DESCRIPTIONS: Record<LanguageId, string> = {
  python: 'Python menulis seperti bahasa manusia — paling ramah untuk memulai logika.',
  java: 'Java menuntut presisi dan eksplisit — melatih disiplin berpikir.',
  go: 'Go sederhana dan lugas — logika tanpa gimmick.',
  c: 'C dekat dengan mesin — memahami bagaimana komputer benar-benar bekerja.',
}

export const LANGUAGE_STRENGTHS: Record<LanguageId, string[]> = {
  python: ['baca alami', 'mudah dicoba', 'perkembangan cepat'],
  java: ['aplikasi besar', 'strong typing', 'ekosistem enterprise'],
  go: ['performansi tinggi', 'konkurensi', 'tooling sederhana'],
  c: ['mengendalikan memori', 'sistem / embedded', 'pemahaman terdalam'],
}