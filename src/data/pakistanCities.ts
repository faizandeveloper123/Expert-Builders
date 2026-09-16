/**
 * Pakistan provinces & cities used by the portal forms (dealership
 * applications + customer inquiries). Curated list provided by Yadea.
 */

export const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir',
] as const;

export const CITY_DATA: Record<string, string[]> = {
  Punjab: [
    'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan', 'Bahawalpur', 'Sargodha',
    'Sialkot', 'Sheikhupura', 'Jhang', 'Rahim Yar Khan', 'Gujrat', 'Kasur', 'Dera Ghazi Khan',
    'Sahiwal', 'Okara', 'Chiniot', 'Kamoke', 'Sadiqabad', 'Burewala', 'Muzaffargarh', 'Muridke',
    'Khanewal', 'Gojra', 'Hafizabad', 'Khanpur', 'Daska', 'Vehari', 'Vihari', 'Jhelum',
    'Mandi Bahauddin', 'Attock', 'Pakpattan', 'Bahawalnagar', 'Ahmadpur East', 'Jaranwala',
    'Samundri', 'Toba Tek Singh', 'Lodhran', 'Mianwali', 'Bhakkar', 'Chakwal', 'Narowal',
    'Wazirabad', 'Kharian', 'Jalalpur Jattan', 'Shakargarh', 'Nankana Sahib', 'Renala Khurd',
    'Depalpur', 'Arifwala', 'Muridwala', 'Pattoki', 'Hasilpur', 'Fort Abbas', 'Liaquatpur',
    'Yazman', 'Taunsa Sharif', 'Kot Addu', 'Alipur', 'Jatoi', 'Pir Mahal', 'Kamalia',
    'Kallar Kahar', 'Taxila', 'Wah Cantonment', 'Hasan Abdal', 'Murree', 'Noorpur Thal',
    'Bhalwal', 'Kot Momin', 'Malakwal', 'Phalia', 'Pind Dadan Khan', 'Khewra', 'Lala Musa',
    'Dina', 'Kallar Syedan', 'Gujar Khan', 'Kahuta', 'Safdarabad', 'Sangla Hill', 'Chunian',
    'Raiwind', 'Ferozewala', 'Sharaqpur Sharif', 'Kamra', 'Fateh Jang', 'Jand', 'Piplan',
    'Isa Khel', 'Kalabagh', 'Darya Khan', 'Mankera', 'Jampur', 'Rajanpur', 'Rojhan',
  ],
  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad',
    'Shikarpur', 'Tando Adam', 'Dadu', 'Tando Allahyar', 'Umerkot', 'Badin', 'Thatta', 'Kotri',
    'Jamshoro', 'Moro', 'Kandhkot', 'Ghotki', 'Khairpur', 'Matiari', 'Sanghar',
    'Tando Muhammad Khan', 'Mirpur Mathelo', 'Sobhodero', 'Rohri', 'Pano Aqil', 'Sehwan',
    'Kot Ghulam Muhammad', 'Digri', 'Kunri', 'Mithi', 'Nagarparkar', 'Chhor', 'Islamkot',
    'Khipro', 'Shahdadpur', 'Tando Jam', 'Hala', 'Shahpur Chakar',
  ],
  'Khyber Pakhtunkhwa': [
    'Peshawar', 'Mardan', 'Mingora', 'Kohat', 'Charsadda', 'Nowshera', 'Haripur', 'Abbottabad',
    'Mansehra', 'Batkhela', 'Timergara', 'Swabi', 'Bannu', 'Dera Ismail Khan', 'Tank', 'Hangu',
    'Parachinar', 'Karak', 'Lakki Marwat', 'Kulachi', 'Daraban', 'Matta', 'Bahrain', 'Kabal',
    'Takht Bhai', 'Topi', 'Rustam', 'Tangi', 'Shabqadar', 'Jamrud', 'Landi Kotal', 'Ali Masjid',
    'Miranshah', 'Wana', 'Razmak', 'Ghulam Khan',
  ],
  Balochistan: [
    'Quetta', 'Khuzdar', 'Turbat', 'Gwadar', 'Panjgur', 'Zhob', 'Loralai', 'Sibi', 'Pishin',
    'Kalat', 'Mastung', 'Hub', 'Awaran', 'Kharan', 'Dalbandin', 'Nushki', 'Ziarat', 'Duki',
    'Musakhel', 'Barkhan', 'Jaffarabad', 'Usta Muhammad', 'Dera Allah Yar', 'Pasni', 'Ormara',
    'Jiwani', 'Surab', 'Mach', 'Gandava', 'Qila Saifullah', 'Qila Abdullah', 'Chaman',
  ],
  'Islamabad Capital Territory': ['Islamabad'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza', 'Chilas', 'Khaplu'],
  'Azad Jammu & Kashmir': [
    'Kotli', 'Mirpur', 'Rawalakot', 'Bagh', 'Muzaffarabad', 'Athmuqam', 'Hattian Bala',
    'Bhimber', 'Sudhanoti', 'Neelum', 'Leepa Valley',
  ],
};

/** Every city across all provinces, deduplicated and alphabetically sorted. */
export const ALL_CITIES: string[] = Array.from(new Set(Object.values(CITY_DATA).flat())).sort(
  (a, b) => a.localeCompare(b)
);

/** Cities for a province (falls back to the full sorted list when empty). */
export function citiesForProvince(province: string): string[] {
  if (!province || !CITY_DATA[province]) return ALL_CITIES;
  return [...CITY_DATA[province]].sort((a, b) => a.localeCompare(b));
}
