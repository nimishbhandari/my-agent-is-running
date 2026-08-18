const files = import.meta.glob("./assets/*.{png,jpg,jpeg,webp}", { eager: true, import: "default" });

const order = ["oneone", "onetwo", "onethree", "onefour", "onefive", "onesix", "oneseven", "oneeight", "onenine"];

export const galleryImages = order
  .map((id) => {
    const entry = Object.entries(files).find(([path]) => path.includes(`/${id}.`));
    return entry ? { id, url: entry[1] } : null;
  })
  .filter(Boolean);
