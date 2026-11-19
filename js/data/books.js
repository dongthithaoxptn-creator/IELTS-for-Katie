/* Listening tests from your own Cambridge books (audio + page images taken from your Drive copies).
   keys[q] = answer. Alternatives with "/", optional words in (brackets), pairs in either order: keys['21-22'] = 'B,D'.
   qp[test][part] = number of question pages; sp = audioscript book pages, per part ({t:{p:[...]}}) or per test ({t:[...]}). */
(function () {
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  function book(o) {
    const dir = 'books/' + o.id + '/';
    return {
      id: o.id, title: o.title, drive: o.drive || '', note: o.note || '',
      tests: [1, 2, 3, 4].map(t => ({
        n: t, keys: o.keys[t],
        parts: [1, 2, 3, 4].map(p => {
          const sp = o.sp && o.sp[t] ? (Array.isArray(o.sp[t]) ? o.sp[t] : o.sp[t][p]) : [];
          return {
            p, audio: 'audio/' + o.id + '/t' + t + 'p' + p + '.' + (o.ext || 'mp3'), from: (p - 1) * 10 + 1, to: p * 10,
            pages: range(1, o.qp[t][p]).map(i => dir + 't' + t + 'p' + p + '-' + i + '.jpg'),
            script: sp.map(n => dir + 'script-' + n + '.jpg')
          };
        })
      }))
    };
  }
  const QP = { 1: { 1: 1, 2: 2, 3: 2, 4: 1 }, 2: { 1: 1, 2: 2, 3: 2, 4: 1 }, 3: { 1: 1, 2: 2, 3: 2, 4: 1 }, 4: { 1: 1, 2: 2, 3: 2, 4: 1 } };

  App.data.books = [
    book({ id: 'cam20', title: 'Cambridge IELTS 20', ext: 'm4a',
      note: 'Question pages from the retyped “CAM 20 Reading - Listening” file; answer key from the Wise English edition (not the official Cambridge key). No audioscripts in these files.',
      qp: { 1: { 1: 1, 2: 2, 3: 2, 4: 1 }, 2: { 1: 1, 2: 2, 3: 2, 4: 1 }, 3: { 1: 1, 2: 2, 3: 2, 4: 1 }, 4: { 1: 1, 2: 1, 3: 2, 4: 1 } },
      keys: {
        1: { 1: 'fish', 2: 'roof', 3: 'Spanish', 4: 'vegetarian', 5: 'Audley', 6: 'hotel', 7: 'reviews', 8: 'local', 9: '30/thirty', 10: 'average',
          11: 'A', 12: 'B', 13: 'C', 14: 'A', 15: 'B', 16: 'C', '17-18': 'A,E', '19-20': 'C,E',
          '21-22': 'C,E', '23-24': 'A,C', '25-26': 'A,B', 27: 'A', 28: 'B', 29: 'A', 30: 'C',
          31: 'factories', 32: 'dead', 33: 'whale', 34: 'apartments', 35: 'park', 36: 'art', 37: 'beaches', 38: 'ferry', 39: 'bikes', 40: 'drone' },
        2: { 1: 'break', 2: 'time', 3: 'shower', 4: 'money', 5: 'memory', 6: 'lifting', 7: 'fall', 8: 'taxi', 9: 'insurance', 10: 'stress',
          11: 'D', 12: 'I', 13: 'H', 14: 'E', 15: 'A', 16: 'B', 17: 'B', 18: 'A', 19: 'B', 20: 'A',
          21: 'D', 22: 'G', 23: 'B', 24: 'A', 25: 'E', 26: 'C', 27: 'A', 28: 'A', 29: 'B', 30: 'C',
          31: 'photos/photographs/pictures', 32: 'vegan', 33: 'chefs/cooks', 34: 'journalists/reporters', 35: 'health', 36: 'coffee', 37: 'environment', 38: 'reputation', 39: 'price/cost', 40: 'soil' },
        3: { 1: '239/two hundred thirty-nine/two hundred and thirty-nine', 2: 'modern', 3: 'lamp', 4: 'Aaron', 5: 'damage', 6: 'electronic', 7: 'insurance', 8: 'space', 9: 'app', 10: 'exchanges',
          11: 'B', 12: 'A', 13: 'A', 14: 'C', 15: 'B', 16: 'C', 17: 'B', 18: 'A', 19: 'G', 20: 'E',
          21: 'B', 22: 'A', 23: 'C', 24: 'A', 25: 'C', 26: 'B', 27: 'F', 28: 'E', 29: 'B', 30: 'D',
          31: 'adaptation', 32: 'cognitive', 33: 'desks', 34: 'taps', 35: 'blue', 36: 'voice', 37: 'pregnant', 38: 'shoulders', 39: 'police', 40: 'temperature' },
        4: { 1: 'Kings/King\'s', 2: '125/one hundred and twenty-five/one hundred twenty-five', 3: 'walking', 4: 'boat', 5: 'Tuesday', 6: 'space', 7: 'vegetarian', 8: '2.30/2:30/two thirty', 9: '75/seventy-five', 10: 'port',
          '11-12': 'B,C', '13-14': 'A,C', 15: 'D', 16: 'F', 17: 'B', 18: 'H', 19: 'C', 20: 'G',
          '21-22': 'C,E', '23-24': 'A,C', 25: 'C', 26: 'A', 27: 'A', 28: 'B', 29: 'B', 30: 'C',
          31: 'rats', 32: 'snakes', 33: 'tourism', 34: 'traffic', 35: 'rain', 36: 'poison', 37: 'building', 38: 'dog', 39: 'noise', 40: 'combination' }
      } }),

    book({ id: 'cam19', title: 'Cambridge IELTS 19',
      qp: { 1: { 1: 1, 2: 2, 3: 2, 4: 1 }, 2: { 1: 2, 2: 2, 3: 2, 4: 1 }, 3: { 1: 2, 2: 2, 3: 2, 4: 1 }, 4: { 1: 1, 2: 2, 3: 2, 4: 1 } },
      sp: { 1: { 1: [98, 99], 2: [99, 100], 3: [100, 101], 4: [101, 102] }, 2: { 1: [102, 103, 104], 2: [104, 105], 3: [105, 106], 4: [106, 107] },
        3: { 1: [107, 108, 109], 2: [109, 110], 3: [110, 111], 4: [111, 112] }, 4: { 1: [113, 114], 2: [114, 115], 3: [115, 116, 117], 4: [117, 118] } },
      keys: {
        1: { 1: '69/sixty-nine', 2: 'stream', 3: 'data', 4: 'map', 5: 'visitors', 6: 'sounds', 7: 'freedom', 8: 'skills', 9: '4.95', 10: 'leaders',
          11: 'B', 12: 'A', 13: 'B', 14: 'C', 15: 'A', 16: 'G', 17: 'C', 18: 'B', 19: 'D', 20: 'A',
          '21-22': 'B,D', '23-24': 'A,E', 25: 'D', 26: 'G', 27: 'C', 28: 'B', 29: 'F', 30: 'H',
          31: 'walls', 32: 'son', 33: 'fuel', 34: 'oxygen', 35: 'rectangular', 36: 'lamps', 37: 'family', 38: 'winter', 39: 'soil', 40: 'rain' },
        2: { 1: 'Mathieson', 2: 'beginners', 3: 'college', 4: 'New', 5: '11 (am)/eleven (am)/11.00 (am)/11:00 (am)', 6: 'instrument', 7: 'ear', 8: 'clapping', 9: 'recording', 10: 'alone',
          11: 'A', 12: 'B', 13: 'A', 14: 'B', 15: 'C', 16: 'A', '17-18': 'C,E', '19-20': 'A,B',
          21: 'A', 22: 'B', 23: 'B', 24: 'B', 25: 'E', 26: 'B', 27: 'A', 28: 'C', 29: 'C', 30: 'A',
          31: 'move', 32: 'short', 33: 'discs/disks', 34: 'oxygen', 35: 'tube', 36: 'temperatures', 37: 'protein', 38: 'space', 39: 'seaweed', 40: 'endangered' },
        3: { 1: 'harbour/harbor', 2: 'bridge', 3: '3.30/3:30/three thirty/half past three/half three', 4: 'Rose', 5: 'sign', 6: 'purple', 7: 'samphire', 8: 'melon', 9: 'coconut', 10: 'strawberry',
          11: 'C', 12: 'D', 13: 'F', 14: 'G', 15: 'B', 16: 'H', '17-18': 'D,E', '19-20': 'B,C',
          21: 'C', 22: 'B', 23: 'A', 24: 'A', 25: 'C', 26: 'C', 27: 'H', 28: 'E', 29: 'B', 30: 'F',
          31: 'clothing', 32: 'mouths', 33: 'salt', 34: 'toothpaste', 35: 'fertilisers/fertilizers', 36: 'nutrients', 37: 'growth', 38: 'weight', 39: 'acid', 40: 'society' },
        4: { 1: 'Kaeden', 2: 'locker(s)', 3: 'passport', 4: 'uniform', 5: 'third/3rd', 6: '0412 665 903', 7: 'yellow', 8: 'plastic', 9: 'ice', 10: 'gloves',
          '11-12': 'C,E', '13-14': 'A,D', 15: 'A', 16: 'B', 17: 'C', 18: 'A', 19: 'C', 20: 'B',
          21: 'A', 22: 'C', 23: 'A', 24: 'B', 25: 'C', 26: 'D', 27: 'F', 28: 'A', 29: 'C', 30: 'G',
          31: 'competition', 32: 'food', 33: 'disease', 34: 'agriculture', 35: 'maps', 36: 'cattle', 37: 'speed', 38: 'monkeys', 39: 'fishing', 40: 'flooding' }
      } }),

    book({ id: 'cam18', title: 'Cambridge IELTS 18',
      qp: { 1: QP[1], 2: { 1: 2, 2: 2, 3: 2, 4: 1 }, 3: QP[3], 4: QP[4] },
      sp: { 1: range(101, 105), 2: range(106, 110), 3: range(111, 115), 4: range(116, 120) },
      keys: {
        1: { 1: 'DW30 7YZ', 2: '24(th) April/April 24(th)/(the) 24th of April', 3: 'dentist', 4: 'parking', 5: 'Claxby', 6: 'late', 7: 'evening', 8: 'supermarket', 9: 'pollution', 10: 'storage',
          11: 'C', 12: 'A', 13: 'A', '14-15': 'B,E', 16: 'B', 17: 'G', 18: 'D', 19: 'A', 20: 'F',
          21: 'A', 22: 'B', 23: 'A', 24: 'C', 25: 'B', 26: 'A', '27-28': 'B,E', '29-30': 'A,C',
          31: 'fences', 32: 'family', 33: 'helicopters', 34: 'stress', 35: 'sides', 36: 'breathing', 37: 'feet', 38: 'employment', 39: 'weapons', 40: 'tourism' },
        2: { 1: 'training', 2: 'discount', 3: 'taxi', 4: 'service', 5: 'English', 6: 'Wivenhoe', 7: 'equipment', 8: '9.75', 9: 'deliveries', 10: 'Sunday',
          '11-12': 'B,E', '13-14': 'B,C', 15: 'G', 16: 'C', 17: 'D', 18: 'B', 19: 'H', 20: 'A',
          21: 'C', 22: 'A', 23: 'B', 24: 'B', '25-26': 'A,B', 27: 'D', 28: 'A', 29: 'C', 30: 'F',
          31: 'convenient', 32: 'suits', 33: 'tailor', 34: 'profession', 35: 'visible', 36: 'string(s)', 37: 'waist(s)', 38: 'perfume', 39: 'image', 40: 'handbag' },
        3: { 1: 'Marrowfield', 2: 'relative', 3: 'socialise/socialize', 4: 'full', 5: 'Domestic Life', 6: 'clouds', 7: 'timing', 8: 'Animal Magic', 9: '(animal) movement', 10: 'dark',
          '11-12': 'B,C', '13-14': 'B,D', 15: 'C', 16: 'B', 17: 'B', 18: 'C', 19: 'A', 20: 'A',
          '21-22': 'A,E', '23-24': 'B,D', 25: 'G', 26: 'E', 27: 'B', 28: 'C', 29: 'F', 30: 'A',
          31: 'technical', 32: 'cheap', 33: 'thousands', 34: 'identification', 35: 'tracking', 36: 'military', 37: 'location', 38: 'prediction', 39: 'database', 40: 'trust' },
        4: { 1: 'receptionist', 2: 'Medical', 3: 'Chastons', 4: 'appointments', 5: 'database', 6: 'experience', 7: 'confident', 8: 'temporary', 9: '1.15/1:15', 10: 'parking',
          11: 'B', 12: 'A', 13: 'A', 14: 'C', 15: 'F', 16: 'G', 17: 'E', 18: 'A', 19: 'C', 20: 'B',
          '21-22': 'B,D', 23: 'D', 24: 'A', 25: 'C', 26: 'G', 27: 'F', 28: 'A', 29: 'B', 30: 'C',
          31: 'plot', 32: 'poverty', 33: 'Europe', 34: 'poetry', 35: 'drawings', 36: 'furniture', 37: 'lamps', 38: 'harbour/harbor', 39: 'children', 40: 'relatives' }
      } }),

    book({ id: 'cam17', title: 'Cambridge IELTS 17', qp: QP,
      sp: { 1: { 1: [96, 97], 2: [97, 98], 3: [98, 99, 100], 4: [100] }, 2: { 1: [101, 102], 2: [102, 103], 3: [103, 104, 105], 4: [105, 106] },
        3: { 1: [107, 108], 2: [108, 109], 3: [109, 110, 111], 4: [111, 112] }, 4: { 1: [113, 114], 2: [114, 115], 3: [115, 116, 117], 4: [117, 118] } },
      keys: {
        1: { 1: 'litter', 2: 'dogs', 3: 'insects', 4: 'butterflies', 5: 'wall', 6: 'island', 7: 'boots', 8: 'beginners', 9: 'spoons', 10: '35/thirty five/thirty-five',
          11: 'A', 12: 'C', 13: 'B', 14: 'B', '15-16': 'A,D', '17-18': 'B,C', '19-20': 'D,E',
          21: 'A', 22: 'B', 23: 'B', 24: 'A', 25: 'C', 26: 'C', 27: 'A', 28: 'E', 29: 'F', 30: 'C',
          31: 'puzzle', 32: 'logic', 33: 'confusion', 34: 'meditation', 35: 'stone', 36: 'coins', 37: 'tree', 38: 'breathing', 39: 'paper', 40: 'anxiety' },
        2: { 1: 'collecting', 2: 'records', 3: 'West', 4: 'transport', 5: 'art', 6: 'hospital', 7: 'garden', 8: 'quiz', 9: 'tickets', 10: 'poster',
          11: 'B', 12: 'C', 13: 'C', 14: 'B', 15: 'D', 16: 'C', 17: 'G', 18: 'A', 19: 'E', 20: 'F',
          '21-22': 'D,E', 23: 'D', 24: 'C', 25: 'A', 26: 'E', 27: 'F', 28: 'B', 29: 'C', 30: 'C',
          31: '321,000', 32: 'vocabulary', 33: 'podcast', 34: 'smartphones', 35: 'bilingual', 36: 'playground', 37: 'picture', 38: 'grammar', 39: 'identity', 40: 'fluent' },
        3: { 1: 'family', 2: 'fit', 3: 'hotels', 4: 'Carrowniskey', 5: 'week', 6: 'bay', 7: 'September', 8: '19/nineteen', 9: '30/thirty', 10: 'boots',
          '11-12': 'B,E', 13: 'C', 14: 'C', 15: 'A', 16: 'E', 17: 'D', 18: 'G', 19: 'F', 20: 'C',
          21: 'B', 22: 'A', 23: 'A', 24: 'B', 25: 'C', 26: 'A', 27: 'D', 28: 'B', 29: 'F', 30: 'H',
          31: 'mud', 32: 'feathers', 33: 'shape', 34: 'moon', 35: 'neck', 36: 'evidence', 37: 'destinations', 38: 'oceans', 39: 'recovery', 40: 'atlas' },
        4: { 1: 'floor(s)', 2: 'fridge', 3: 'shirts', 4: 'windows', 5: 'balcony', 6: 'electrician', 7: 'dust', 8: 'police', 9: 'training', 10: 'review',
          11: 'A', 12: 'A', 13: 'A', 14: 'C', 15: 'A', 16: 'C', 17: 'B', 18: 'C', 19: 'B', 20: 'A',
          '21-22': 'C,E', '23-24': 'A,D', 25: 'B', 26: 'F', 27: 'A', 28: 'D', 29: 'C', 30: 'G',
          31: 'golden', 32: 'healthy', 33: 'climate', 34: 'rock(s)', 35: 'diameter', 36: 'tube', 37: 'fire', 38: 'steam', 39: 'cloudy', 40: 'litre/liter' }
      } }),

    book({ id: 'cam16', title: 'Cambridge IELTS 16', qp: QP,
      sp: { 1: range(99, 104), 2: range(105, 110), 3: range(111, 115), 4: range(116, 121) },
      keys: {
        1: { 1: 'egg', 2: 'tower', 3: 'car', 4: 'animals', 5: 'bridge', 6: 'movie/film', 7: 'decorate', 8: 'Wednesdays', 9: 'Fradstone', 10: 'parking',
          11: 'C', 12: 'A', 13: 'B', 14: 'C', 15: 'H', 16: 'C', 17: 'G', 18: 'B', 19: 'I', 20: 'A',
          '21-22': 'C,E', '23-24': 'B,E', 25: 'D', 26: 'C', 27: 'A', 28: 'H', 29: 'F', 30: 'G',
          31: 'practical', 32: 'publication', 33: 'choices', 34: 'negative', 35: 'play', 36: 'capitalism', 37: 'depression', 38: 'logic', 39: 'opportunity', 40: 'practice/practise' },
        2: { 1: 'frame', 2: '195', 3: 'payment', 4: 'Grandparents', 5: 'colour/color', 6: 'hand', 7: 'background', 8: 'focus', 9: 'ten (days)/10 (days)', 10: 'plastic',
          11: 'C', 12: 'B', 13: 'A', 14: 'A', 15: 'C', 16: 'D', 17: 'A', 18: 'B', '19-20': 'B,C',
          21: 'B', 22: 'A', 23: 'C', 24: 'C', 25: 'history', 26: 'paper', 27: 'humans/people', 28: 'stress', 29: 'graph', 30: 'evaluate',
          31: 'creativity', 32: 'therapy', 33: 'fitness', 34: 'balance', 35: 'brain', 36: 'motivation', 37: 'isolation', 38: 'calories', 39: 'obesity', 40: 'habit' },
        3: { 1: 'park', 2: 'blue', 3: 'reference', 4: 'story', 5: 'rain', 6: 'snack', 7: 'medication', 8: 'helmet', 9: 'tent', 10: '199',
          '11-12': 'A,C', '13-14': 'B,C', 15: 'D', 16: 'F', 17: 'A', 18: 'H', 19: 'C', 20: 'G',
          '21-22': 'C,D', '23-24': 'C,E', 25: 'C', 26: 'A', 27: 'B', 28: 'A', 29: 'A', 30: 'C',
          31: 'grandmother', 32: 'decade', 33: 'equipment', 34: 'economic', 35: 'basic', 36: 'round', 37: 'bone', 38: 'rough', 39: 'style', 40: 'sheep' },
        4: { 1: '28th', 2: '550', 3: 'Chervil', 4: 'garage', 5: 'garden', 6: 'parking', 7: 'wood', 8: 'bridge', 9: 'monument', 10: 'March',
          11: 'C', 12: 'A', 13: 'B', 14: 'B', 15: 'C', 16: 'F', 17: 'A', 18: 'I', 19: 'E', 20: 'H',
          '21-22': 'B,C', '23-24': 'B,C', 25: 'C', 26: 'F', 27: 'D', 28: 'E', 29: 'B', 30: 'A',
          31: 'spice(s)', 32: 'colony/settlement', 33: 'fat', 34: 'head', 35: 'movement', 36: 'balance/balancing', 37: 'brain', 38: 'smell', 39: 'rats', 40: 'forest' }
      } })
  ];
})();
