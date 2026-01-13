const mongoose = require('mongoose');
const config = require('./config/env');
const Category = require('./models/category.model');

// Helper function to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Category data structure: 3 levels (root -> sub -> sub-sub)
const categoriesData = [
  // ========== CPU ==========
  {
    name: 'CPU',
    componentType: 'CPU',
    level: 0,
    description: 'Central Processing Unit - Bộ xử lý trung tâm của máy tính',
    metaTitle: 'CPU - Bộ xử lý trung tâm',
    metaDescription: 'CPU Intel, AMD và các dòng bộ xử lý hiệu năng cao cho PC',
    metaKeywords: ['CPU', 'processor', 'bộ xử lý', 'Intel', 'AMD'],
    children: [
      {
        name: 'CPU Intel',
        componentType: 'CPU',
        level: 1,
        description: 'Bộ xử lý Intel - Hiệu năng cao, ổn định',
        metaTitle: 'CPU Intel - Bộ xử lý Intel',
        metaDescription: 'CPU Intel Core i3, i5, i7, i9 và Xeon cho mọi nhu cầu',
        metaKeywords: ['CPU Intel', 'Intel Core', 'Intel processor'],
        children: [
          { name: 'CPU Intel Core i3', componentType: 'CPU', level: 2, description: 'CPU Intel Core i3 - Entry level, giá rẻ' },
          { name: 'CPU Intel Core i5', componentType: 'CPU', level: 2, description: 'CPU Intel Core i5 - Mid-range, cân bằng hiệu năng' },
          { name: 'CPU Intel Core i7', componentType: 'CPU', level: 2, description: 'CPU Intel Core i7 - High-end, hiệu năng cao' },
          { name: 'CPU Intel Core i9', componentType: 'CPU', level: 2, description: 'CPU Intel Core i9 - Flagship, hiệu năng tối đa' },
          { name: 'CPU Intel Xeon', componentType: 'CPU', level: 2, description: 'CPU Intel Xeon - Server và workstation' },
          { name: 'CPU Intel Pentium', componentType: 'CPU', level: 2, description: 'CPU Intel Pentium - Budget, giá rẻ' },
          { name: 'CPU Intel Celeron', componentType: 'CPU', level: 2, description: 'CPU Intel Celeron - Entry level, tiết kiệm điện' }
        ]
      },
      {
        name: 'CPU AMD',
        componentType: 'CPU',
        level: 1,
        description: 'Bộ xử lý AMD - Hiệu năng/giá tốt',
        metaTitle: 'CPU AMD - Bộ xử lý AMD',
        metaDescription: 'CPU AMD Ryzen 3, 5, 7, 9 và Threadripper',
        metaKeywords: ['CPU AMD', 'AMD Ryzen', 'AMD processor'],
        children: [
          { name: 'CPU AMD Ryzen 3', componentType: 'CPU', level: 2, description: 'CPU AMD Ryzen 3 - Entry level, giá tốt' },
          { name: 'CPU AMD Ryzen 5', componentType: 'CPU', level: 2, description: 'CPU AMD Ryzen 5 - Mid-range, hiệu năng tốt' },
          { name: 'CPU AMD Ryzen 7', componentType: 'CPU', level: 2, description: 'CPU AMD Ryzen 7 - High-end, đa nhiệm mạnh' },
          { name: 'CPU AMD Ryzen 9', componentType: 'CPU', level: 2, description: 'CPU AMD Ryzen 9 - Flagship, hiệu năng cực cao' },
          { name: 'CPU AMD Threadripper', componentType: 'CPU', level: 2, description: 'CPU AMD Threadripper - Workstation, server' },
          { name: 'CPU AMD Athlon', componentType: 'CPU', level: 2, description: 'CPU AMD Athlon - Budget, giá rẻ' },
          { name: 'CPU AMD EPYC', componentType: 'CPU', level: 2, description: 'CPU AMD EPYC - Server, enterprise' }
        ]
      }
    ]
  },

  // ========== VGA (Graphics Card) ==========
  {
    name: 'VGA',
    componentType: 'VGA',
    level: 0,
    description: 'Graphics Card - Card đồ họa, xử lý hình ảnh',
    metaTitle: 'VGA - Card đồ họa',
    metaDescription: 'VGA NVIDIA, AMD và các card đồ họa gaming, workstation',
    metaKeywords: ['VGA', 'graphics card', 'GPU', 'card đồ họa'],
    children: [
      {
        name: 'VGA NVIDIA',
        componentType: 'VGA',
        level: 1,
        description: 'Card đồ họa NVIDIA - Hiệu năng gaming cao',
        metaTitle: 'VGA NVIDIA - Card đồ họa NVIDIA',
        metaDescription: 'VGA NVIDIA RTX, GTX series cho gaming và creative',
        metaKeywords: ['VGA NVIDIA', 'NVIDIA RTX', 'NVIDIA GTX'],
        children: [
          { name: 'VGA NVIDIA RTX 4090', componentType: 'VGA', level: 2, description: 'VGA NVIDIA RTX 4090 - Flagship, hiệu năng tối đa' },
          { name: 'VGA NVIDIA RTX 4080', componentType: 'VGA', level: 2, description: 'VGA NVIDIA RTX 4080 - High-end, 4K gaming' },
          { name: 'VGA NVIDIA RTX 4070', componentType: 'VGA', level: 2, description: 'VGA NVIDIA RTX 4070 - High-end, 1440p gaming' },
          { name: 'VGA NVIDIA RTX 4060', componentType: 'VGA', level: 2, description: 'VGA NVIDIA RTX 4060 - Mid-range, 1080p gaming' },
          { name: 'VGA NVIDIA RTX 3090', componentType: 'VGA', level: 2, description: 'VGA NVIDIA RTX 3090 - Previous gen flagship' },
          { name: 'VGA NVIDIA RTX 3080', componentType: 'VGA', level: 2, description: 'VGA NVIDIA RTX 3080 - Previous gen high-end' },
          { name: 'VGA NVIDIA RTX 3070', componentType: 'VGA', level: 2, description: 'VGA NVIDIA RTX 3070 - Previous gen mid-high' },
          { name: 'VGA NVIDIA RTX 3060', componentType: 'VGA', level: 2, description: 'VGA NVIDIA RTX 3060 - Previous gen mid-range' },
          { name: 'VGA NVIDIA GTX 1660', componentType: 'VGA', level: 2, description: 'VGA NVIDIA GTX 1660 - Budget gaming' },
          { name: 'VGA NVIDIA GTX 1650', componentType: 'VGA', level: 2, description: 'VGA NVIDIA GTX 1650 - Entry level gaming' }
        ]
      },
      {
        name: 'VGA AMD',
        componentType: 'VGA',
        level: 1,
        description: 'Card đồ họa AMD Radeon - Hiệu năng/giá tốt',
        metaTitle: 'VGA AMD - Card đồ họa AMD',
        metaDescription: 'VGA AMD RX series cho gaming và content creation',
        metaKeywords: ['VGA AMD', 'AMD Radeon', 'AMD RX'],
        children: [
          { name: 'VGA AMD RX 7900 XTX', componentType: 'VGA', level: 2, description: 'VGA AMD RX 7900 XTX - Flagship AMD' },
          { name: 'VGA AMD RX 7900 XT', componentType: 'VGA', level: 2, description: 'VGA AMD RX 7900 XT - High-end AMD' },
          { name: 'VGA AMD RX 7800 XT', componentType: 'VGA', level: 2, description: 'VGA AMD RX 7800 XT - High-end' },
          { name: 'VGA AMD RX 7700 XT', componentType: 'VGA', level: 2, description: 'VGA AMD RX 7700 XT - Mid-high' },
          { name: 'VGA AMD RX 7600', componentType: 'VGA', level: 2, description: 'VGA AMD RX 7600 - Mid-range' },
          { name: 'VGA AMD RX 6900 XT', componentType: 'VGA', level: 2, description: 'VGA AMD RX 6900 XT - Previous gen flagship' },
          { name: 'VGA AMD RX 6800 XT', componentType: 'VGA', level: 2, description: 'VGA AMD RX 6800 XT - Previous gen high-end' },
          { name: 'VGA AMD RX 6700 XT', componentType: 'VGA', level: 2, description: 'VGA AMD RX 6700 XT - Previous gen mid-high' },
          { name: 'VGA AMD RX 6600', componentType: 'VGA', level: 2, description: 'VGA AMD RX 6600 - Budget gaming' }
        ]
      },
      {
        name: 'VGA Intel',
        componentType: 'VGA',
        level: 1,
        description: 'Card đồ họa Intel Arc - Mới ra mắt',
        metaTitle: 'VGA Intel - Card đồ họa Intel Arc',
        metaDescription: 'VGA Intel Arc series - Lựa chọn mới cho gaming',
        metaKeywords: ['VGA Intel', 'Intel Arc', 'Intel graphics'],
        children: [
          { name: 'VGA Intel Arc A770', componentType: 'VGA', level: 2, description: 'VGA Intel Arc A770 - High-end Intel' },
          { name: 'VGA Intel Arc A750', componentType: 'VGA', level: 2, description: 'VGA Intel Arc A750 - Mid-range Intel' },
          { name: 'VGA Intel Arc A380', componentType: 'VGA', level: 2, description: 'VGA Intel Arc A380 - Entry level Intel' }
        ]
      }
    ]
  },

  // ========== RAM ==========
  {
    name: 'RAM',
    componentType: 'RAM',
    level: 0,
    description: 'Random Access Memory - Bộ nhớ truy cập ngẫu nhiên',
    metaTitle: 'RAM - Bộ nhớ máy tính',
    metaDescription: 'RAM DDR4, DDR5 cho desktop và laptop',
    metaKeywords: ['RAM', 'memory', 'DDR4', 'DDR5', 'bộ nhớ'],
    children: [
      {
        name: 'RAM DDR4',
        componentType: 'RAM',
        level: 1,
        description: 'RAM DDR4 - Chuẩn phổ biến hiện tại',
        metaTitle: 'RAM DDR4 - Bộ nhớ DDR4',
        metaDescription: 'RAM DDR4 desktop và laptop, nhiều tốc độ',
        metaKeywords: ['RAM DDR4', 'DDR4 memory'],
        children: [
          { name: 'RAM DDR4 Desktop', componentType: 'RAM', level: 2, description: 'RAM DDR4 cho desktop PC' },
          { name: 'RAM DDR4 Laptop', componentType: 'RAM', level: 2, description: 'RAM DDR4 cho laptop (SO-DIMM)' },
          { name: 'RAM DDR4 3200MHz', componentType: 'RAM', level: 2, description: 'RAM DDR4 tốc độ 3200MHz' },
          { name: 'RAM DDR4 3600MHz', componentType: 'RAM', level: 2, description: 'RAM DDR4 tốc độ 3600MHz' },
          { name: 'RAM DDR4 4000MHz', componentType: 'RAM', level: 2, description: 'RAM DDR4 tốc độ 4000MHz' }
        ]
      },
      {
        name: 'RAM DDR5',
        componentType: 'RAM',
        level: 1,
        description: 'RAM DDR5 - Chuẩn mới, hiệu năng cao hơn',
        metaTitle: 'RAM DDR5 - Bộ nhớ DDR5',
        metaDescription: 'RAM DDR5 desktop, hiệu năng vượt trội',
        metaKeywords: ['RAM DDR5', 'DDR5 memory'],
        children: [
          { name: 'RAM DDR5 Desktop', componentType: 'RAM', level: 2, description: 'RAM DDR5 cho desktop PC' },
          { name: 'RAM DDR5 5600MHz', componentType: 'RAM', level: 2, description: 'RAM DDR5 tốc độ 5600MHz' },
          { name: 'RAM DDR5 6000MHz', componentType: 'RAM', level: 2, description: 'RAM DDR5 tốc độ 6000MHz' },
          { name: 'RAM DDR5 6400MHz', componentType: 'RAM', level: 2, description: 'RAM DDR5 tốc độ 6400MHz' },
          { name: 'RAM DDR5 7200MHz', componentType: 'RAM', level: 2, description: 'RAM DDR5 tốc độ 7200MHz' }
        ]
      },
      {
        name: 'RAM DDR3',
        componentType: 'RAM',
        level: 1,
        description: 'RAM DDR3 - Chuẩn cũ, vẫn còn sử dụng',
        metaTitle: 'RAM DDR3 - Bộ nhớ DDR3',
        metaDescription: 'RAM DDR3 cho hệ thống cũ',
        metaKeywords: ['RAM DDR3', 'DDR3 memory'],
        children: [
          { name: 'RAM DDR3 Desktop', componentType: 'RAM', level: 2, description: 'RAM DDR3 cho desktop PC' },
          { name: 'RAM DDR3 Laptop', componentType: 'RAM', level: 2, description: 'RAM DDR3 cho laptop' }
        ]
      }
    ]
  },

  // ========== Mainboard ==========
  {
    name: 'Mainboard',
    componentType: 'Mainboard',
    level: 0,
    description: 'Motherboard - Bo mạch chủ',
    metaTitle: 'Mainboard - Bo mạch chủ',
    metaDescription: 'Mainboard Intel, AMD các form factor ATX, mATX, ITX',
    metaKeywords: ['mainboard', 'motherboard', 'bo mạch chủ'],
    children: [
      {
        name: 'Mainboard Intel',
        componentType: 'Mainboard',
        level: 1,
        description: 'Bo mạch chủ hỗ trợ CPU Intel',
        metaTitle: 'Mainboard Intel - Bo mạch chủ Intel',
        metaDescription: 'Mainboard Intel socket LGA1700, LGA1200',
        metaKeywords: ['mainboard Intel', 'Intel motherboard'],
        children: [
          { name: 'Mainboard Intel Z790', componentType: 'Mainboard', level: 2, description: 'Mainboard Intel Z790 - High-end, overclock' },
          { name: 'Mainboard Intel B760', componentType: 'Mainboard', level: 2, description: 'Mainboard Intel B760 - Mid-range' },
          { name: 'Mainboard Intel H770', componentType: 'Mainboard', level: 2, description: 'Mainboard Intel H770 - Mid-range' },
          { name: 'Mainboard Intel Z690', componentType: 'Mainboard', level: 2, description: 'Mainboard Intel Z690 - Previous gen' },
          { name: 'Mainboard Intel B660', componentType: 'Mainboard', level: 2, description: 'Mainboard Intel B660 - Previous gen mid' }
        ]
      },
      {
        name: 'Mainboard AMD',
        componentType: 'Mainboard',
        level: 1,
        description: 'Bo mạch chủ hỗ trợ CPU AMD',
        metaTitle: 'Mainboard AMD - Bo mạch chủ AMD',
        metaDescription: 'Mainboard AMD socket AM5, AM4',
        metaKeywords: ['mainboard AMD', 'AMD motherboard'],
        children: [
          { name: 'Mainboard AMD X670E', componentType: 'Mainboard', level: 2, description: 'Mainboard AMD X670E - Flagship, overclock' },
          { name: 'Mainboard AMD X670', componentType: 'Mainboard', level: 2, description: 'Mainboard AMD X670 - High-end' },
          { name: 'Mainboard AMD B650E', componentType: 'Mainboard', level: 2, description: 'Mainboard AMD B650E - Mid-high' },
          { name: 'Mainboard AMD B650', componentType: 'Mainboard', level: 2, description: 'Mainboard AMD B650 - Mid-range' },
          { name: 'Mainboard AMD X570', componentType: 'Mainboard', level: 2, description: 'Mainboard AMD X570 - Previous gen high' },
          { name: 'Mainboard AMD B550', componentType: 'Mainboard', level: 2, description: 'Mainboard AMD B550 - Previous gen mid' }
        ]
      }
    ]
  },

  // ========== Storage ==========
  {
    name: 'Storage',
    componentType: 'Storage',
    level: 0,
    description: 'Storage - Ổ lưu trữ dữ liệu',
    metaTitle: 'Storage - Ổ lưu trữ',
    metaDescription: 'SSD, HDD, NVMe cho mọi nhu cầu lưu trữ',
    metaKeywords: ['storage', 'SSD', 'HDD', 'ổ cứng'],
    children: [
      {
        name: 'Storage SSD',
        componentType: 'Storage',
        level: 1,
        description: 'SSD - Ổ cứng thể rắn, tốc độ cao',
        metaTitle: 'SSD - Ổ cứng thể rắn',
        metaDescription: 'SSD SATA, NVMe M.2 cho tốc độ nhanh',
        metaKeywords: ['SSD', 'solid state drive'],
        children: [
          { name: 'Storage SSD NVMe M.2', componentType: 'Storage', level: 2, description: 'SSD NVMe M.2 - Tốc độ cực nhanh' },
          { name: 'Storage SSD SATA', componentType: 'Storage', level: 2, description: 'SSD SATA - Tốc độ tốt, giá hợp lý' },
          { name: 'Storage SSD PCIe 4.0', componentType: 'Storage', level: 2, description: 'SSD PCIe 4.0 - Tốc độ cao nhất' },
          { name: 'Storage SSD PCIe 3.0', componentType: 'Storage', level: 2, description: 'SSD PCIe 3.0 - Tốc độ tốt' },
          { name: 'Storage SSD External', componentType: 'Storage', level: 2, description: 'SSD External - Di động, tiện lợi' }
        ]
      },
      {
        name: 'Storage HDD',
        componentType: 'Storage',
        level: 1,
        description: 'HDD - Ổ cứng cơ, dung lượng lớn',
        metaTitle: 'HDD - Ổ cứng cơ',
        metaDescription: 'HDD desktop và laptop, dung lượng lớn',
        metaKeywords: ['HDD', 'hard disk drive', 'ổ cứng cơ'],
        children: [
          { name: 'Storage HDD Desktop', componentType: 'Storage', level: 2, description: 'HDD Desktop 3.5 inch' },
          { name: 'Storage HDD Laptop', componentType: 'Storage', level: 2, description: 'HDD Laptop 2.5 inch' },
          { name: 'Storage HDD External', componentType: 'Storage', level: 2, description: 'HDD External - Di động' }
        ]
      }
    ]
  },

  // ========== PSU (Power Supply) ==========
  {
    name: 'PSU',
    componentType: 'PSU',
    level: 0,
    description: 'Power Supply Unit - Nguồn máy tính',
    metaTitle: 'PSU - Nguồn máy tính',
    metaDescription: 'PSU 80 Plus Bronze, Gold, Platinum, Titanium',
    metaKeywords: ['PSU', 'power supply', 'nguồn máy tính'],
    children: [
      {
        name: 'PSU 80 Plus Bronze',
        componentType: 'PSU',
        level: 1,
        description: 'PSU 80 Plus Bronze - Hiệu suất cơ bản',
        metaTitle: 'PSU 80 Plus Bronze',
        metaDescription: 'PSU Bronze hiệu suất 82-85%',
        metaKeywords: ['PSU Bronze', '80 Plus Bronze'],
        children: [
          { name: 'PSU 80 Plus Bronze 550W', componentType: 'PSU', level: 2, description: 'PSU Bronze 550W' },
          { name: 'PSU 80 Plus Bronze 650W', componentType: 'PSU', level: 2, description: 'PSU Bronze 650W' },
          { name: 'PSU 80 Plus Bronze 750W', componentType: 'PSU', level: 2, description: 'PSU Bronze 750W' },
          { name: 'PSU 80 Plus Bronze 850W', componentType: 'PSU', level: 2, description: 'PSU Bronze 850W' }
        ]
      },
      {
        name: 'PSU 80 Plus Gold',
        componentType: 'PSU',
        level: 1,
        description: 'PSU 80 Plus Gold - Hiệu suất tốt',
        metaTitle: 'PSU 80 Plus Gold',
        metaDescription: 'PSU Gold hiệu suất 87-90%',
        metaKeywords: ['PSU Gold', '80 Plus Gold'],
        children: [
          { name: 'PSU 80 Plus Gold 550W', componentType: 'PSU', level: 2, description: 'PSU Gold 550W' },
          { name: 'PSU 80 Plus Gold 650W', componentType: 'PSU', level: 2, description: 'PSU Gold 650W' },
          { name: 'PSU 80 Plus Gold 750W', componentType: 'PSU', level: 2, description: 'PSU Gold 750W' },
          { name: 'PSU 80 Plus Gold 850W', componentType: 'PSU', level: 2, description: 'PSU Gold 850W' },
          { name: 'PSU 80 Plus Gold 1000W', componentType: 'PSU', level: 2, description: 'PSU Gold 1000W' }
        ]
      },
      {
        name: 'PSU 80 Plus Platinum',
        componentType: 'PSU',
        level: 1,
        description: 'PSU 80 Plus Platinum - Hiệu suất cao',
        metaTitle: 'PSU 80 Plus Platinum',
        metaDescription: 'PSU Platinum hiệu suất 89-92%',
        metaKeywords: ['PSU Platinum', '80 Plus Platinum'],
        children: [
          { name: 'PSU 80 Plus Platinum 750W', componentType: 'PSU', level: 2, description: 'PSU Platinum 750W' },
          { name: 'PSU 80 Plus Platinum 850W', componentType: 'PSU', level: 2, description: 'PSU Platinum 850W' },
          { name: 'PSU 80 Plus Platinum 1000W', componentType: 'PSU', level: 2, description: 'PSU Platinum 1000W' },
          { name: 'PSU 80 Plus Platinum 1200W', componentType: 'PSU', level: 2, description: 'PSU Platinum 1200W' }
        ]
      },
      {
        name: 'PSU 80 Plus Titanium',
        componentType: 'PSU',
        level: 1,
        description: 'PSU 80 Plus Titanium - Hiệu suất tối đa',
        metaTitle: 'PSU 80 Plus Titanium',
        metaDescription: 'PSU Titanium hiệu suất 94-96%',
        metaKeywords: ['PSU Titanium', '80 Plus Titanium'],
        children: [
          { name: 'PSU 80 Plus Titanium 850W', componentType: 'PSU', level: 2, description: 'PSU Titanium 850W' },
          { name: 'PSU 80 Plus Titanium 1000W', componentType: 'PSU', level: 2, description: 'PSU Titanium 1000W' },
          { name: 'PSU 80 Plus Titanium 1200W', componentType: 'PSU', level: 2, description: 'PSU Titanium 1200W' }
        ]
      }
    ]
  },

  // ========== Case ==========
  {
    name: 'Case',
    componentType: 'Case',
    level: 0,
    description: 'PC Case - Vỏ máy tính',
    metaTitle: 'Case - Vỏ máy tính',
    metaDescription: 'PC Case ATX, mATX, ITX các kích thước',
    metaKeywords: ['case', 'PC case', 'vỏ máy tính', 'chassis'],
    children: [
      {
        name: 'Case ATX',
        componentType: 'Case',
        level: 1,
        description: 'Case ATX - Full tower, mid tower',
        metaTitle: 'Case ATX',
        metaDescription: 'Case ATX full size cho gaming PC',
        metaKeywords: ['case ATX', 'ATX case'],
        children: [
          { name: 'Case ATX Full Tower', componentType: 'Case', level: 2, description: 'Case ATX Full Tower - Kích thước lớn' },
          { name: 'Case ATX Mid Tower', componentType: 'Case', level: 2, description: 'Case ATX Mid Tower - Phổ biến nhất' },
          { name: 'Case ATX Mini Tower', componentType: 'Case', level: 2, description: 'Case ATX Mini Tower - Nhỏ gọn' }
        ]
      },
      {
        name: 'Case mATX',
        componentType: 'Case',
        level: 1,
        description: 'Case mATX - Micro ATX, compact',
        metaTitle: 'Case mATX',
        metaDescription: 'Case mATX nhỏ gọn, tiết kiệm không gian',
        metaKeywords: ['case mATX', 'micro ATX case'],
        children: [
          { name: 'Case mATX Standard', componentType: 'Case', level: 2, description: 'Case mATX Standard' },
          { name: 'Case mATX Compact', componentType: 'Case', level: 2, description: 'Case mATX Compact' }
        ]
      },
      {
        name: 'Case ITX',
        componentType: 'Case',
        level: 1,
        description: 'Case ITX - Mini ITX, siêu nhỏ gọn',
        metaTitle: 'Case ITX',
        metaDescription: 'Case ITX mini, SFF (Small Form Factor)',
        metaKeywords: ['case ITX', 'mini ITX case', 'SFF'],
        children: [
          { name: 'Case ITX Standard', componentType: 'Case', level: 2, description: 'Case ITX Standard' },
          { name: 'Case ITX Ultra Compact', componentType: 'Case', level: 2, description: 'Case ITX Ultra Compact' }
        ]
      }
    ]
  },

  // ========== Cooling ==========
  {
    name: 'Cooling',
    componentType: 'Cooling',
    level: 0,
    description: 'Cooling - Tản nhiệt',
    metaTitle: 'Cooling - Tản nhiệt',
    metaDescription: 'CPU Cooler, Case Fan, AIO Water Cooling',
    metaKeywords: ['cooling', 'tản nhiệt', 'CPU cooler', 'fan'],
    children: [
      {
        name: 'Cooling CPU Air',
        componentType: 'Cooling',
        level: 1,
        description: 'CPU Air Cooler - Tản nhiệt khí',
        metaTitle: 'CPU Air Cooler',
        metaDescription: 'CPU Air Cooler tower, low profile',
        metaKeywords: ['CPU air cooler', 'air cooling'],
        children: [
          { name: 'Cooling CPU Air Tower', componentType: 'Cooling', level: 2, description: 'CPU Air Cooler Tower - Hiệu quả cao' },
          { name: 'Cooling CPU Air Low Profile', componentType: 'Cooling', level: 2, description: 'CPU Air Cooler Low Profile - Nhỏ gọn' },
          { name: 'Cooling CPU Air Budget', componentType: 'Cooling', level: 2, description: 'CPU Air Cooler Budget - Giá rẻ' }
        ]
      },
      {
        name: 'Cooling CPU AIO',
        componentType: 'Cooling',
        level: 1,
        description: 'CPU AIO Water Cooling - Tản nhiệt nước',
        metaTitle: 'CPU AIO Water Cooling',
        metaDescription: 'AIO (All-In-One) Water Cooling cho CPU',
        metaKeywords: ['AIO', 'water cooling', 'liquid cooling'],
        children: [
          { name: 'Cooling CPU AIO 120mm', componentType: 'Cooling', level: 2, description: 'AIO 120mm - Nhỏ gọn' },
          { name: 'Cooling CPU AIO 240mm', componentType: 'Cooling', level: 2, description: 'AIO 240mm - Phổ biến' },
          { name: 'Cooling CPU AIO 280mm', componentType: 'Cooling', level: 2, description: 'AIO 280mm - Hiệu quả cao' },
          { name: 'Cooling CPU AIO 360mm', componentType: 'Cooling', level: 2, description: 'AIO 360mm - Tối đa' }
        ]
      },
      {
        name: 'Cooling Case Fan',
        componentType: 'Cooling',
        level: 1,
        description: 'Case Fan - Quạt case',
        metaTitle: 'Case Fan',
        metaDescription: 'Case Fan 120mm, 140mm, RGB',
        metaKeywords: ['case fan', 'PC fan', 'chassis fan'],
        children: [
          { name: 'Cooling Case Fan 120mm', componentType: 'Cooling', level: 2, description: 'Case Fan 120mm' },
          { name: 'Cooling Case Fan 140mm', componentType: 'Cooling', level: 2, description: 'Case Fan 140mm' },
          { name: 'Cooling Case Fan RGB', componentType: 'Cooling', level: 2, description: 'Case Fan RGB - Có đèn LED' }
        ]
      }
    ]
  },

  // ========== Monitor ==========
  {
    name: 'Monitor',
    componentType: 'Monitor',
    level: 0,
    description: 'Monitor - Màn hình máy tính',
    metaTitle: 'Monitor - Màn hình máy tính',
    metaDescription: 'Monitor gaming, office, creative các kích thước',
    metaKeywords: ['monitor', 'màn hình', 'display'],
    children: [
      {
        name: 'Monitor Gaming',
        componentType: 'Monitor',
        level: 1,
        description: 'Gaming Monitor - Màn hình gaming',
        metaTitle: 'Gaming Monitor',
        metaDescription: 'Gaming Monitor 144Hz, 240Hz, 4K',
        metaKeywords: ['gaming monitor', '144Hz', '240Hz'],
        children: [
          { name: 'Monitor Gaming 1080p', componentType: 'Monitor', level: 2, description: 'Gaming Monitor 1080p Full HD' },
          { name: 'Monitor Gaming 1440p', componentType: 'Monitor', level: 2, description: 'Gaming Monitor 1440p QHD' },
          { name: 'Monitor Gaming 4K', componentType: 'Monitor', level: 2, description: 'Gaming Monitor 4K UHD' },
          { name: 'Monitor Gaming Ultrawide', componentType: 'Monitor', level: 2, description: 'Gaming Monitor Ultrawide' },
          { name: 'Monitor Gaming Curved', componentType: 'Monitor', level: 2, description: 'Gaming Monitor Curved - Cong' }
        ]
      },
      {
        name: 'Monitor Office',
        componentType: 'Monitor',
        level: 1,
        description: 'Office Monitor - Màn hình văn phòng',
        metaTitle: 'Office Monitor',
        metaDescription: 'Office Monitor giá rẻ, tiết kiệm điện',
        metaKeywords: ['office monitor', 'business monitor'],
        children: [
          { name: 'Monitor Office 1080p', componentType: 'Monitor', level: 2, description: 'Office Monitor 1080p' },
          { name: 'Monitor Office 1440p', componentType: 'Monitor', level: 2, description: 'Office Monitor 1440p' },
          { name: 'Monitor Office 4K', componentType: 'Monitor', level: 2, description: 'Office Monitor 4K' }
        ]
      },
      {
        name: 'Monitor Creative',
        componentType: 'Monitor',
        level: 1,
        description: 'Creative Monitor - Màn hình chuyên nghiệp',
        metaTitle: 'Creative Monitor',
        metaDescription: 'Creative Monitor color accurate, wide gamut',
        metaKeywords: ['creative monitor', 'professional monitor', 'color accurate'],
        children: [
          { name: 'Monitor Creative 4K', componentType: 'Monitor', level: 2, description: 'Creative Monitor 4K' },
          { name: 'Monitor Creative 5K', componentType: 'Monitor', level: 2, description: 'Creative Monitor 5K' },
          { name: 'Monitor Creative Ultrawide', componentType: 'Monitor', level: 2, description: 'Creative Monitor Ultrawide' }
        ]
      }
    ]
  },

  // ========== Keyboard ==========
  {
    name: 'Keyboard',
    componentType: 'Keyboard',
    level: 0,
    description: 'Keyboard - Bàn phím',
    metaTitle: 'Keyboard - Bàn phím',
    metaDescription: 'Gaming Keyboard, Mechanical Keyboard, Office Keyboard',
    metaKeywords: ['keyboard', 'bàn phím', 'mechanical keyboard'],
    children: [
      {
        name: 'Keyboard Mechanical',
        componentType: 'Keyboard',
        level: 1,
        description: 'Mechanical Keyboard - Bàn phím cơ',
        metaTitle: 'Mechanical Keyboard',
        metaDescription: 'Mechanical Keyboard với switch Cherry, Gateron, Kailh',
        metaKeywords: ['mechanical keyboard', 'bàn phím cơ'],
        children: [
          { name: 'Keyboard Mechanical Full Size', componentType: 'Keyboard', level: 2, description: 'Mechanical Keyboard Full Size' },
          { name: 'Keyboard Mechanical TKL', componentType: 'Keyboard', level: 2, description: 'Mechanical Keyboard TKL (Tenkeyless)' },
          { name: 'Keyboard Mechanical 60%', componentType: 'Keyboard', level: 2, description: 'Mechanical Keyboard 60%' },
          { name: 'Keyboard Mechanical RGB', componentType: 'Keyboard', level: 2, description: 'Mechanical Keyboard RGB' }
        ]
      },
      {
        name: 'Keyboard Gaming',
        componentType: 'Keyboard',
        level: 1,
        description: 'Gaming Keyboard - Bàn phím gaming',
        metaTitle: 'Gaming Keyboard',
        metaDescription: 'Gaming Keyboard với macro keys, RGB',
        metaKeywords: ['gaming keyboard', 'bàn phím gaming'],
        children: [
          { name: 'Keyboard Gaming Full Size', componentType: 'Keyboard', level: 2, description: 'Gaming Keyboard Full Size' },
          { name: 'Keyboard Gaming TKL', componentType: 'Keyboard', level: 2, description: 'Gaming Keyboard TKL' },
          { name: 'Keyboard Gaming Wireless', componentType: 'Keyboard', level: 2, description: 'Gaming Keyboard Wireless' }
        ]
      },
      {
        name: 'Keyboard Office',
        componentType: 'Keyboard',
        level: 1,
        description: 'Office Keyboard - Bàn phím văn phòng',
        metaTitle: 'Office Keyboard',
        metaDescription: 'Office Keyboard giá rẻ, tiếng ồn thấp',
        metaKeywords: ['office keyboard', 'bàn phím văn phòng'],
        children: [
          { name: 'Keyboard Office Membrane', componentType: 'Keyboard', level: 2, description: 'Office Keyboard Membrane' },
          { name: 'Keyboard Office Wireless', componentType: 'Keyboard', level: 2, description: 'Office Keyboard Wireless' }
        ]
      }
    ]
  },

  // ========== Mouse ==========
  {
    name: 'Mouse',
    componentType: 'Mouse',
    level: 0,
    description: 'Mouse - Chuột máy tính',
    metaTitle: 'Mouse - Chuột máy tính',
    metaDescription: 'Gaming Mouse, Office Mouse, Wireless Mouse',
    metaKeywords: ['mouse', 'chuột', 'gaming mouse'],
    children: [
      {
        name: 'Mouse Gaming',
        componentType: 'Mouse',
        level: 1,
        description: 'Gaming Mouse - Chuột gaming',
        metaTitle: 'Gaming Mouse',
        metaDescription: 'Gaming Mouse với sensor cao, DPI cao',
        metaKeywords: ['gaming mouse', 'chuột gaming'],
        children: [
          { name: 'Mouse Gaming Wired', componentType: 'Mouse', level: 2, description: 'Gaming Mouse Wired - Có dây' },
          { name: 'Mouse Gaming Wireless', componentType: 'Mouse', level: 2, description: 'Gaming Mouse Wireless - Không dây' },
          { name: 'Mouse Gaming RGB', componentType: 'Mouse', level: 2, description: 'Gaming Mouse RGB - Có đèn LED' },
          { name: 'Mouse Gaming FPS', componentType: 'Mouse', level: 2, description: 'Gaming Mouse FPS - Chuyên FPS' }
        ]
      },
      {
        name: 'Mouse Office',
        componentType: 'Mouse',
        level: 1,
        description: 'Office Mouse - Chuột văn phòng',
        metaTitle: 'Office Mouse',
        metaDescription: 'Office Mouse giá rẻ, tiện dụng',
        metaKeywords: ['office mouse', 'chuột văn phòng'],
        children: [
          { name: 'Mouse Office Wired', componentType: 'Mouse', level: 2, description: 'Office Mouse Wired' },
          { name: 'Mouse Office Wireless', componentType: 'Mouse', level: 2, description: 'Office Mouse Wireless' },
          { name: 'Mouse Office Ergonomic', componentType: 'Mouse', level: 2, description: 'Office Mouse Ergonomic - Thoải mái' }
        ]
      }
    ]
  },

  // ========== Audio ==========
  {
    name: 'Audio',
    componentType: 'Audio',
    level: 0,
    description: 'Audio - Thiết bị âm thanh',
    metaTitle: 'Audio - Thiết bị âm thanh',
    metaDescription: 'Headphone, Speaker, Microphone cho PC',
    metaKeywords: ['audio', 'headphone', 'speaker', 'microphone'],
    children: [
      {
        name: 'Audio Headphone',
        componentType: 'Audio',
        level: 1,
        description: 'Headphone - Tai nghe',
        metaTitle: 'Headphone',
        metaDescription: 'Gaming Headphone, Studio Headphone',
        metaKeywords: ['headphone', 'tai nghe'],
        children: [
          { name: 'Audio Headphone Gaming', componentType: 'Audio', level: 2, description: 'Gaming Headphone - Tai nghe gaming' },
          { name: 'Audio Headphone Studio', componentType: 'Audio', level: 2, description: 'Studio Headphone - Tai nghe studio' },
          { name: 'Audio Headphone Wireless', componentType: 'Audio', level: 2, description: 'Wireless Headphone - Tai nghe không dây' }
        ]
      },
      {
        name: 'Audio Speaker',
        componentType: 'Audio',
        level: 1,
        description: 'Speaker - Loa máy tính',
        metaTitle: 'Speaker',
        metaDescription: 'PC Speaker, Gaming Speaker',
        metaKeywords: ['speaker', 'loa'],
        children: [
          { name: 'Audio Speaker 2.0', componentType: 'Audio', level: 2, description: 'Speaker 2.0 - Loa 2 kênh' },
          { name: 'Audio Speaker 2.1', componentType: 'Audio', level: 2, description: 'Speaker 2.1 - Loa 2.1 có subwoofer' },
          { name: 'Audio Speaker 5.1', componentType: 'Audio', level: 2, description: 'Speaker 5.1 - Loa 5.1 surround' },
          { name: 'Audio Speaker Gaming', componentType: 'Audio', level: 2, description: 'Gaming Speaker - Loa gaming' }
        ]
      },
      {
        name: 'Audio Microphone',
        componentType: 'Audio',
        level: 1,
        description: 'Microphone - Micro',
        metaTitle: 'Microphone',
        metaDescription: 'Gaming Microphone, Streaming Microphone',
        metaKeywords: ['microphone', 'micro', 'mic'],
        children: [
          { name: 'Audio Microphone USB', componentType: 'Audio', level: 2, description: 'USB Microphone' },
          { name: 'Audio Microphone XLR', componentType: 'Audio', level: 2, description: 'XLR Microphone - Chuyên nghiệp' },
          { name: 'Audio Microphone Gaming', componentType: 'Audio', level: 2, description: 'Gaming Microphone' }
        ]
      }
    ]
  },

  // ========== Networking ==========
  {
    name: 'Networking',
    componentType: 'Networking',
    level: 0,
    description: 'Networking - Thiết bị mạng',
    metaTitle: 'Networking - Thiết bị mạng',
    metaDescription: 'WiFi Card, Ethernet Card, Router',
    metaKeywords: ['networking', 'WiFi', 'Ethernet', 'router'],
    children: [
      {
        name: 'Networking WiFi Card',
        componentType: 'Networking',
        level: 1,
        description: 'WiFi Card - Card WiFi',
        metaTitle: 'WiFi Card',
        metaDescription: 'WiFi Card PCIe, USB cho desktop',
        metaKeywords: ['WiFi card', 'wireless card'],
        children: [
          { name: 'Networking WiFi Card PCIe', componentType: 'Networking', level: 2, description: 'WiFi Card PCIe' },
          { name: 'Networking WiFi Card USB', componentType: 'Networking', level: 2, description: 'WiFi Card USB' },
          { name: 'Networking WiFi Card AX', componentType: 'Networking', level: 2, description: 'WiFi 6/6E Card (AX)' }
        ]
      },
      {
        name: 'Networking Ethernet Card',
        componentType: 'Networking',
        level: 1,
        description: 'Ethernet Card - Card mạng có dây',
        metaTitle: 'Ethernet Card',
        metaDescription: 'Ethernet Card 1Gbps, 10Gbps',
        metaKeywords: ['ethernet card', 'network card'],
        children: [
          { name: 'Networking Ethernet Card 1Gbps', componentType: 'Networking', level: 2, description: 'Ethernet Card 1Gbps' },
          { name: 'Networking Ethernet Card 10Gbps', componentType: 'Networking', level: 2, description: 'Ethernet Card 10Gbps' }
        ]
      }
    ]
  },

  // ========== Other ==========
  {
    name: 'Other',
    componentType: 'Other',
    level: 0,
    description: 'Other - Phụ kiện khác',
    metaTitle: 'Other - Phụ kiện khác',
    metaDescription: 'Các phụ kiện PC khác',
    metaKeywords: ['other', 'phụ kiện', 'accessories'],
    children: [
      {
        name: 'Other Cable',
        componentType: 'Other',
        level: 1,
        description: 'Cable - Dây cáp',
        metaTitle: 'Cable',
        metaDescription: 'Các loại dây cáp cho PC',
        metaKeywords: ['cable', 'dây cáp'],
        children: [
          { name: 'Other Cable Power', componentType: 'Other', level: 2, description: 'Power Cable - Dây nguồn' },
          { name: 'Other Cable SATA', componentType: 'Other', level: 2, description: 'SATA Cable - Dây SATA' },
          { name: 'Other Cable Extension', componentType: 'Other', level: 2, description: 'Cable Extension - Dây nối dài' }
        ]
      },
      {
        name: 'Other Thermal Paste',
        componentType: 'Other',
        level: 1,
        description: 'Thermal Paste - Keo tản nhiệt',
        metaTitle: 'Thermal Paste',
        metaDescription: 'Thermal Paste cho CPU, GPU',
        metaKeywords: ['thermal paste', 'keo tản nhiệt'],
        children: [
          { name: 'Other Thermal Paste Standard', componentType: 'Other', level: 2, description: 'Thermal Paste Standard' },
          { name: 'Other Thermal Paste Premium', componentType: 'Other', level: 2, description: 'Thermal Paste Premium' }
        ]
      }
    ]
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI, {
      dbName: config.MONGODB_DB_NAME,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing categories
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log(`\n⚠️  Found ${existingCategories} existing categories. Clearing...`);
      await Category.deleteMany({});
      console.log('✅ Cleared existing categories');
    }

    let totalCreated = 0;
    const createdCategories = new Map(); // Store created categories by name for parent reference

    // Function to create category
    async function createCategory(categoryData, parentId = null, sortOrder = 0) {
      const category = new Category({
        name: categoryData.name,
        slug: generateSlug(categoryData.name),
        description: categoryData.description || '',
        componentType: categoryData.componentType,
        level: categoryData.level,
        parentId: parentId,
        isActive: true,
        sortOrder: sortOrder,
        metaTitle: categoryData.metaTitle || categoryData.name,
        metaDescription: categoryData.metaDescription || categoryData.description || '',
        metaKeywords: categoryData.metaKeywords || []
      });

      const savedCategory = await category.save();
      createdCategories.set(categoryData.name, savedCategory._id);
      totalCreated++;
      return savedCategory;
    }

    // Process all categories recursively
    for (let i = 0; i < categoriesData.length; i++) {
      const rootCategory = categoriesData[i];
      
      // Create root category (level 0)
      const root = await createCategory(rootCategory, null, i);
      console.log(`✓ Created: ${root.name} (level ${root.level})`);

      // Create sub-categories (level 1)
      if (rootCategory.children) {
        for (let j = 0; j < rootCategory.children.length; j++) {
          const subCategory = rootCategory.children[j];
          const sub = await createCategory(subCategory, root._id, j);
          console.log(`  ✓ Created: ${sub.name} (level ${sub.level})`);

          // Create sub-sub-categories (level 2)
          if (subCategory.children) {
            for (let k = 0; k < subCategory.children.length; k++) {
              const subSubCategory = subCategory.children[k];
              const subSub = await createCategory(subSubCategory, sub._id, k);
              console.log(`    ✓ Created: ${subSub.name} (level ${subSub.level})`);
            }
          }
        }
      }
    }

    console.log(`\n✅ Successfully seeded ${totalCreated} categories!`);
    console.log(`   - Root categories (level 0): ${categoriesData.length}`);
    
    // Count by level
    const level0Count = await Category.countDocuments({ level: 0 });
    const level1Count = await Category.countDocuments({ level: 1 });
    const level2Count = await Category.countDocuments({ level: 2 });
    
    console.log(`   - Level 0 (root): ${level0Count}`);
    console.log(`   - Level 1 (sub): ${level1Count}`);
    console.log(`   - Level 2 (sub-sub): ${level2Count}`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedCategories();

