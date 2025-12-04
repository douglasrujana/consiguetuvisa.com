## Git
git pull --rebase origin main. El --rebase intentará aplicar tus commits locales después de los cambios que vengan del remoto,
  manteniendo un historial más lineal y evitando un commit de merge extra. Esto es más limpio, pero si hay conflictos, tendré que resolverlos.

git rebase --continue 

- uses: pnpm/action-setup@v2
  with:
    version: 9
