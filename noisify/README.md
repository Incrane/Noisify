This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testning med Playwright

- Starta utvecklingsservern lokalt. Om port 3000 är upptagen använder Next.js närmsta fria port (ex. 3002). Notera vilken port som används.
- Sätt bas-URL för Playwright via `PLAYWRIGHT_BASE_URL`, t.ex.

```powershell
$env:PLAYWRIGHT_BASE_URL="http://localhost:3002"; npx playwright test
```

- Inloggningssidan nås via `/login` (tidigare `/logga-in`). Säkerställ att tester pekar på rätt sökväg.
- HTML-rapport genereras automatiskt och exponeras lokalt (se CLI-output).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Instruktörsflöde för kurser

Staff-sidorna har nu en förbättrad instruktörsmodal:

- **Instruktörer:** listar befintliga poster i `public.instructors` som kan väljas direkt.
- **Personal:** listar organisationens personal (från `org_user`). När en eller flera markeras och väljs skapas motsvarande poster i `public.instructors` automatiskt innan de kopplas till kursen.
- **Extern instruktör:** låter personalen registrera helt nya externa instruktörer via formulär.

Detta gör det möjligt att skapa kurser utan att först manuellt skapa instruktörer i databasen.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
