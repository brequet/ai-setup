TODO:

- rename to agent-setup ?
- rework readme, its total bs right now -> dont forget, its supposed to work with opencode
- [ ] What about AGENTS.md ; could i like define in a catalog a part to be inject in AGENTS.MD, and then my cli tool does clean injection in the user AGENTS.MD file ? (how to track part ? marker in md ?)
- [ ] how to handles MCP config ? some mcp needs to do some auth, some to have api keys ready etc.. How to handle genericly install of mcp then ? scripting ? Merge of json ?
- [ ] how to handle agents/sub-agents conf too ? since its need to tweak opencode config json file, need to resolve (its jsonc with comment, we can put markers,dates etc in the json file)
- [ ] what about sharing some direct opencode conf ? Like keybinds etc (to be injected in existing or not opencode json conf file)
- [ ] have a default catalogs setup (for official catalogs for example)
- [ ] make it so sync command propose to the user to install updates if any
- [ ] pre commit hook: fmt + lint + test
- see if catalog priority is used, useful or not
- cmd "remove" to remove a catalog, skill or mcp from config and disk ?

## Issues

### Dependency Management & "Shadow" Files

In src/commands/list.ts, you scan the skillsDir and identify "Other skills" that aren't in your config.

The Issue: Your CLI currently manages files but doesn't fully "own" them. If a user deletes a folder manually, your config.installed becomes out of sync.

The Fix: You should implement a "reconcile" or "repair" function. Before running sync or list, the CLI should verify that every entry in config.installed actually exists on disk. If not, mark it as "broken" or auto-remove it from the config.

-> Maybe if removed while in "installed" state, mark them as "missing", so we assume its the user that removed it, so we can force reinstall them ONLY AND ONLY IF -f or --force flag is used ? Else we must assume the user had good reasons to remove it.

### Shell Command Insecurity

In src/utils/git.ts (implied by usage in add.ts), you likely use exec or spawn to run git clone.

The Issue: If you are passing user-provided URLs or branch names directly to a shell, you are potentially vulnerable to command injection.

The Fix: Always use spawn with an arguments array rather than exec with a string template. Even better, use a library like simple-git which handles the escaping for you.

### Git Syncing Reliability

In src/commands/sync.ts, you iterate through catalogs and pull changes.

The Issue: If a git pull fails due to a network error, you simply log a warning and continue. In a production tool, you should differentiate between "Network Down" (retryable) and "Repo Moved/Private" (fatal).

The Fix: Implement a retry logic for network-related Git errors.
