export const seedProducts = [
  {
    id: 'p1',
    title: 'Shonen Hero Tee',
    slug: 'shonen-hero-tee',
    description: 'Premium cotton tee with iconic shonen pose print.',
    base_price: 199,
    currency: 'MAD',
    rating: 4.9,
    created_at: '2024-09-01',
    images: [
      { url: 'https://images.unsplash.com/photo-1520975922219-29ae4b9bba1f?q=80&w=600&auto=format&fit=crop', alt: 'Shonen hero tee 1' },
      { url: 'https://images.unsplash.com/photo-1520975922219-29ae4b9bba1f?q=80&w=600&auto=format&fit=crop', alt: 'Shonen hero tee 2' }
    ],
    variants: [
      { id:'v1', size:'S', color:'Black', price:199, stock:10 },
      { id:'v2', size:'M', color:'Black', price:199, stock:20 },
      { id:'v3', size:'L', color:'Black', price:199, stock:15 },
      { id:'v4', size:'XL', color:'Black', price:199, stock:5 },
      { id:'v5', size:'M', color:'White', price:199, stock:12 },
    ]
  },
  {
    id: 'p2',
    title: 'Mecha Hoodie',
    slug: 'mecha-hoodie',
    description: 'Cozy fleece hoodie with retro mecha print.',
    base_price: 349,
    currency: 'MAD',
    rating: 4.8,
    created_at: '2024-09-03',
    images: [
      { url: 'https://images.unsplash.com/photo-1548883354-7622d3f7aadf?q=80&w=600&auto=format&fit=crop', alt: 'Mecha hoodie' }
    ],
    variants: [
      { id:'v6', size:'M', color:'Black', price:349, stock:8 },
      { id:'v7', size:'L', color:'Black', price:349, stock:6 },
      { id:'v8', size:'XL', color:'Black', price:349, stock:4 },
    ]
  },
  {
    id: 'p3',
    title: 'Samurai Tee',
    slug: 'samurai-tee',
    description: 'Minimal samurai silhouette on soft tee.',
    base_price: 219,
    currency: 'MAD',
    rating: 4.7,
    created_at: '2024-08-28',
    images: [
      { url: 'https://images.unsplash.com/photo-1552224240-8732d8e0e2f4?q=80&w=600&auto=format&fit=crop', alt: 'Samurai tee' }
    ],
    variants: [
      { id:'v9', size:'S', color:'White', price:219, stock:10 },
      { id:'v10', size:'M', color:'White', price:219, stock:10 },
      { id:'v11', size:'L', color:'White', price:219, stock:10 },
      { id:'v12', size:'XL', color:'White', price:219, stock:10 },
    ]
  },
  {
    id: 'p4',
    title: 'Ninja Stealth Hoodie',
    slug: 'ninja-stealth-hoodie',
    description: 'All-black hoodie with subtle ninja crest.',
    base_price: 359,
    currency: 'MAD',
    rating: 4.9,
    created_at: '2024-09-05',
    images: [
      { url: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600&auto=format&fit=crop', alt: 'Ninja hoodie' }
    ],
    variants: [
      { id:'v13', size:'M', color:'Black', price:359, stock:7 },
      { id:'v14', size:'L', color:'Black', price:359, stock:5 },
      { id:'v15', size:'XL', color:'Black', price:359, stock:3 },
    ]
  },
  {
    id: 'p5', title: 'Chibi Squad Tee', slug: 'chibi-squad-tee', description: 'Cute chibi characters, vibrant print.', base_price: 189, currency:'MAD', rating:4.6, created_at: '2024-08-20', images:[{url:'https://images.unsplash.com/photo-1520975922219-29ae4b9bba1f?q=80&w=600&auto=format&fit=crop'}], variants:[{id:'v16', size:'M', color:'Blue', price:189, stock:14}] },
  { id: 'p6', title: 'Retro Pixel Tee', slug:'retro-pixel-tee', description:'Pixel art homage tee.', base_price:199, currency:'MAD', rating:4.5, created_at:'2024-08-18', images:[{url:'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=600&auto=format&fit=crop'}], variants:[{id:'v17', size:'L', color:'Red', price:199, stock:8}] },
  { id: 'p7', title: 'Spirit Fox Hoodie', slug:'spirit-fox-hoodie', description:'Mythic fox graphic hoodie.', base_price:339, currency:'MAD', rating:4.7, created_at:'2024-08-30', images:[{url:'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=600&auto=format&fit=crop'}], variants:[{id:'v18', size:'M', color:'White', price:339, stock:9}] },
  { id: 'p8', title: 'Arcade Neon Tee', slug:'arcade-neon-tee', description:'Neon arcade vibes tee.', base_price:209, currency:'MAD', rating:4.6, created_at:'2024-09-07', images:[{url:'https://images.unsplash.com/photo-1548883354-7622d3f7aadf?q=80&w=600&auto=format&fit=crop'}], variants:[{id:'v19', size:'S', color:'Black', price:209, stock:11}] },
]
