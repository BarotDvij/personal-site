# Joining uwaterloo.network

Ready-to-submit draft. Needs your photo and your go-ahead.

## 1. Fork and add your photo

Fork [Shayaan-Azeem/waterloo.network](https://github.com/Shayaan-Azeem/waterloo.network) and add a square 400×400 image:

```
public/photos/dvij-barot.jpg
```

## 2. Add yourself to `src/data/members.ts`

```typescript
{
  id: "dvij-barot",
  name: "Dvij Barot",
  website: "https://dvijbarot.wiki",
  profilePic: "/photos/dvij-barot.jpg",
  program: "Management Engineering",
  linkedin: "https://www.linkedin.com/in/barotdvij",
  connections: ["shayaan-azeem"],
},
```

Friends already in the ring can go in `connections` once you confirm their ids (Mohammed Elshrief and Poneesh Kumar may be listed).

## 3. Open the PR

Title: `Add Dvij Barot`

## 4. After it merges

Add the widget to the footer slot in `src/components/Wiki.astro` (the element with `data-webring-slot`):

```html
<script src="https://uwaterloo.network/embed.js" data-webring data-user="dvij-barot"></script>
```
