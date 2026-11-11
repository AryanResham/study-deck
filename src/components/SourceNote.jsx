// Shows where an item came from: a quote found in the notes, or a warning
const SourceNote = ({ item }) => {
  if (item.sourceFound === true) {
    return <p className="text-xs text-zinc-500">From your notes: “{item.source}”</p>;
  }
  if (item.sourceFound === false) {
    return <p className="text-xs text-zinc-400">⚠ May not be from your notes</p>;
  }
  // Topic mode has nothing to check against
  return null;
};

export default SourceNote;
