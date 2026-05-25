export default function Header({ subtitle, num }) {
  return (
    <div className="bg-darkBg text-center py-5 px-4 relative">
      <div className="border-t border-gold mx-12 mb-3"></div>
      <h1 className="title-elegant text-3xl">
        Jotta <span className="italic font-normal">&amp;</span> Cristal
      </h1>
      <div className="text-xs text-gold tracking-[0.25em] uppercase mt-1">
        30 de Mayo · Badajoz
      </div>
      <div className="text-[10px] text-goldDark tracking-[0.3em] uppercase mt-2">
        ✦ &nbsp; Bingo de Boda &nbsp; ✦
      </div>
      <div className="border-t border-gold mx-12 mt-3"></div>
      {subtitle && (
        <div className="text-[11px] text-gold/80 tracking-[0.2em] uppercase mt-3">{subtitle}</div>
      )}
      {num && (
        <div className="absolute top-3 right-4 text-[10px] text-gold tracking-widest">Nº {num}</div>
      )}
    </div>
  )
}
