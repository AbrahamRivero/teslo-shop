/* eslint-disable prettier/prettier */
import { hashSync } from 'bcrypt';

interface SeedProduct {
  description: string;
  images: string[];
  stock: number;
  price: number;
  sizes: ValidSizes[];
  slug: string;
  tags: string[];
  title: string;
  type: ValidTypes;
  gender: 'men' | 'women' | 'kid' | 'unisex';
}

type ValidSizes = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
type ValidTypes = 'shirts' | 'pants' | 'hoodies' | 'hats';

interface SeedUser {
  email: string;
  fullName: string;
  password: string;
  roles: string[];
}
interface SeedData {
  products: SeedProduct[];
  users: SeedUser[];
}

export const initialData: SeedData = {
  users: [
    {
      email: 'test1@gmail.com',
      fullName: 'Test One',
      password: hashSync('Abc123', 12),
      roles: ['user', 'admin'],
    },
  ],
  products: [
    // sweatshirt tag
    {
      description: "Introducing the Tesla Chill Collection. The Men's Chill Crew Neck Sweatshirt has a premium, heavyweight exterior and soft fleece interior for comfort in any season.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 7,
      price: 75,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      slug: 'mens_chill_crew_neck_sweatshirt',
      type: 'shirts',
      tags: ['sweatshirt'],
      title: "Men's Chill Crew Neck Sweatshirt",
      gender: 'men',
    },
    {
      description: "The Women's Raven Slouchy Crew Sweatshirt has a premium, relaxed silhouette made from a sustainable bamboo cotton blend.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 9,
      price: 110,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      slug: 'women_raven_slouchy_crew_sweatshirt',
      type: 'hoodies',
      tags: ['sweatshirt'],
      title: "Women's Raven Slouchy Crew Sweatshirt",
      gender: 'women',
    },
    {
      description: "The Men's Raven Lightweight Hoodie has a premium, relaxed silhouette made from a sustainable bamboo cotton blend.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 10,
      price: 115,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      slug: 'men_raven_lightweight_hoodie',
      type: 'hoodies',
      tags: ['sweatshirt'],
      title: "Men's Raven Lightweight Hoodie",
      gender: 'men',
    },

    // jacket tag
    {
      description: "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 5,
      price: 200,
      sizes: ['XS', 'S', 'M', 'XL', 'XXL'],
      slug: 'men_quilted_shirt_jacket',
      type: 'shirts',
      tags: ['jacket'],
      title: "Men's Quilted Shirt Jacket",
      gender: 'men',
    },
    {
      description: "The Women's Cropped Puffer Jacket features a uniquely cropped silhouette for the perfect, modern style.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 85,
      price: 225,
      sizes: ['XS', 'S', 'M'],
      slug: 'women_cropped_puffer_jacket',
      type: 'hoodies',
      tags: ['jacket'],
      title: "Women's Cropped Puffer Jacket",
      gender: 'women',
    },
    {
      description: "Kids Cyberquad Bomber Jacket features a graffiti-style illustration of our Cyberquad silhouette and wordmark.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 10,
      price: 65,
      sizes: ['XS', 'S', 'M'],
      slug: 'kids_cyberquad_bomber_jacket',
      type: 'shirts',
      tags: ['jacket'],
      title: "Kids Cyberquad Bomber Jacket",
      gender: 'kid',
    },

    // shirt tag
    {
      description: "The Men's Turbine Long Sleeve Tee features a subtle, water-based T logo on the left chest.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 50,
      price: 45,
      sizes: ['XS', 'S', 'M', 'L'],
      slug: 'men_turbine_long_sleeve_tee',
      type: 'shirts',
      tags: ['shirt'],
      title: "Men's Turbine Long Sleeve Tee",
      gender: 'men',
    },
    {
      description: "The Women's T Logo Short Sleeve Scoop Neck Tee features a tonal 3D silicone-printed T logo.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 30,
      price: 35,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      slug: 'women_t_logo_short_sleeve_scoop_neck_tee',
      type: 'shirts',
      tags: ['shirt'],
      title: "Women's T Logo Short Sleeve Scoop Neck Tee",
      gender: 'women',
    },
    {
      description: "Kids Cybertruck Graffiti Long Sleeve Tee features a water-based Cybertruck graffiti wordmark.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 10,
      price: 30,
      sizes: ['XS', 'S', 'M'],
      slug: 'kids_cybertruck_long_sleeve_tee',
      type: 'shirts',
      tags: ['shirt'],
      title: "Kids Cybertruck Long Sleeve Tee",
      gender: 'kid',
    },

    // hoodie tag
    {
      description: "The Chill Pullover Hoodie has a premium, heavyweight exterior and soft fleece interior for comfort.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 10,
      price: 130,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      slug: 'chill_pullover_hoodie',
      type: 'hoodies',
      tags: ['hoodie'],
      title: "Chill Pullover Hoodie",
      gender: 'unisex',
    },
    {
      description: "The Men's Chill Full Zip Hoodie has a premium, heavyweight exterior and soft fleece interior.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 100,
      price: 85,
      sizes: ['XS', 'L', 'XL', 'XXL'],
      slug: 'men_chill_full_zip_hoodie',
      type: 'shirts',
      tags: ['hoodie'],
      title: "Men's Chill Full Zip Hoodie",
      gender: 'men',
    },
    {
      description: "The Women's Chill Half Zip Cropped Hoodie has a premium, soft fleece exterior and cropped silhouette.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 10,
      price: 130,
      sizes: ['XS', 'S', 'M', 'XXL'],
      slug: 'women_chill_half_zip_cropped_hoodie',
      type: 'hoodies',
      tags: ['hoodie'],
      title: "Women's Chill Half Zip Cropped Hoodie",
      gender: 'women',
    },

    // hats tag
    {
      description: "The Relaxed T Logo Hat features a 3D T logo and a custom metal buckle closure.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 11,
      price: 30,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      slug: 'relaxed_t_logo_hat',
      type: 'hats',
      tags: ['hats'],
      title: "Relaxed T Logo Hat",
      gender: 'unisex',
    },
    {
      description: "The Thermal Cuffed Beanie features a classic silhouette with modern details.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 13,
      price: 35,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      slug: 'thermal_cuffed_beanie',
      type: 'hats',
      tags: ['hats'],
      title: "Thermal Cuffed Beanie",
      gender: 'unisex',
    },
    {
      description: "The 3D Large Wordmark Pullover Hoodie features a tone-on-tone 3D silicone-printed wordmark.",
      images: ['https://ucarecdn.com/38d54ba2-6b3e-4ab5-994c-109101f97d17/-/preview/666x1000/', 'https://ucarecdn.com/444a25e3-57a3-4601-9dd2-17dcbdccc6ff/-/preview/666x1000/'],
      stock: 15,
      price: 70,
      sizes: ['XS', 'S', 'XL', 'XXL'],
      slug: '3d_large_wordmark_pullover_hoodie',
      type: 'hats',
      tags: ['hats'],
      title: "3D Large Wordmark Pullover Hoodie",
      gender: 'unisex',
    },
  ],
};
