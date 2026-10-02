from pathlib import Path

from manim import *

# Wolven design system, from site/.vitepress/theme/custom.css
GROUND = "#fcfcfb"
SURFACE = "#ffffff"
INK = "#1c1c1c"
INK2 = "#3d3d3d"
INK3 = "#8a8a8a"
RULE = "#d9d9d9"
FILL = "#f2f2f2"
ACCENT = "#f8613f"
SANS = "Archivo"
DISPLAY = "Bai Jamjuree"
LOGO = Path(__file__).resolve().parent.parent / "assets" / "wolven-logo-black.png"

config.background_color = GROUND


def display(s, size=44, color=INK):
    return Text(s, font=DISPLAY, weight=BOLD, font_size=size, color=color)


def body(s, size=26, color=INK2, weight=NORMAL):
    return Text(s, font=SANS, font_size=size, color=color, weight=weight)


def label(s, size=16, color=ACCENT):
    return Text(s.upper(), font=SANS, font_size=size, color=color, weight=BOLD)


def mono(s, size=22, color=INK):
    return Text(s, font="DejaVu Sans Mono", font_size=size, color=color)


def card(text, w=3.0, h=0.8, size=20, color=INK2, border=RULE, fill=SURFACE, upper=True):
    r = Rectangle(width=w, height=h, stroke_color=border, stroke_width=2, fill_color=fill, fill_opacity=1)
    t = (label(text, size, color) if upper else body(text, size, color)).move_to(r)
    return VGroup(r, t)


def accent_card(text, **k):
    c = card(text, **k)
    bar = Rectangle(width=0.08, height=c[0].height, stroke_width=0, fill_color=ACCENT, fill_opacity=1)
    bar.align_to(c[0], LEFT).align_to(c[0], UP)
    return VGroup(c, bar)


class HarnessExplainer(Scene):
    def header(self, n, kicker, title):
        k = label(f"{n:02d} · {kicker}", 18).to_corner(UL, buff=0.6)
        t = display(title, 40).next_to(k, DOWN, aligned_edge=LEFT, buff=0.2)
        rule = Line(LEFT * 7.1, RIGHT * 7.1, stroke_color=RULE, stroke_width=2).next_to(t, DOWN, buff=0.3)
        rule.set_x(0)
        self.play(FadeIn(k, shift=RIGHT * 0.2), Write(t), Create(rule), run_time=1)
        return VGroup(k, t, rule)

    def takeaway(self, s):
        bar = Rectangle(width=0.08, height=0.55, stroke_width=0, fill_color=ACCENT, fill_opacity=1)
        t = body(s, 26, INK, weight=MEDIUM)
        g = VGroup(bar, t).arrange(RIGHT, buff=0.3).to_edge(DOWN, buff=0.6)
        self.play(FadeIn(bar), Write(t), run_time=1.2)
        return g

    def clear_all(self):
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.6)
        self.wait(0.2)

    def construct(self):
        self.intro()
        self.without()
        self.context()
        self.decisions()
        self.verify()
        self.scope()
        self.control()
        self.portable()
        self.measurable()
        self.outro()

    def intro(self):
        logo = ImageMobject(str(LOGO)).scale_to_fit_height(1.4).shift(UP * 1.4)
        name = display("wolven-harness", 64).next_to(logo, DOWN, buff=0.4)
        q = body("Por que dar um harness ao seu agente?", 30, INK2).next_to(name, DOWN, buff=0.35)
        line = Line(LEFT * 1, RIGHT * 1, stroke_color=ACCENT, stroke_width=6).next_to(q, DOWN, buff=0.4)
        self.play(FadeIn(logo, scale=0.9))
        self.play(Write(name))
        self.play(FadeIn(q, shift=UP * 0.2), Create(line))
        self.wait(1.5)
        self.clear_all()

    def without(self):
        h = self.header(0, "o ponto de partida", "Sem harness, toda sessão começa do zero")
        sessions = VGroup()
        for i in range(4):
            c = card(f"sessão {i + 1}", w=2.6, h=0.7, size=16)
            bar_bg = Rectangle(width=2.6, height=0.18, stroke_width=0, fill_color=FILL, fill_opacity=1)
            bar = Rectangle(width=2.6 * 0.7, height=0.18, stroke_width=0, fill_color=ACCENT, fill_opacity=1)
            bar_bg.next_to(c, DOWN, buff=0.15)
            bar.align_to(bar_bg, LEFT).align_to(bar_bg, UP)
            sessions.add(VGroup(c, bar_bg, bar))
        sessions.arrange(RIGHT, buff=0.5).shift(UP * 0.4)
        legend = VGroup(
            Rectangle(width=0.3, height=0.18, stroke_width=0, fill_color=ACCENT, fill_opacity=1),
            body("re-explicar contexto, convenções e decisões", 20, INK3),
        ).arrange(RIGHT, buff=0.2).next_to(sessions, DOWN, buff=0.6)
        for s in sessions:
            self.play(FadeIn(s[0]), FadeIn(s[1]), GrowFromEdge(s[2], LEFT), run_time=0.6)
        self.play(FadeIn(legend))
        self.wait(0.6)
        harness = VGroup(*[s[2] for s in sessions])
        thin = VGroup(*[
            Rectangle(width=2.6 * 0.08, height=0.18, stroke_width=0, fill_color=ACCENT, fill_opacity=1)
            .align_to(s[1], LEFT).align_to(s[1], UP)
            for s in sessions
        ])
        with_label = label("com harness: o repositório já explica", 16, INK).next_to(legend, DOWN, buff=0.35)
        self.play(Transform(harness, thin), FadeIn(with_label), run_time=1.4)
        self.takeaway("O conhecimento mora no repositório, não na memória da conversa.")
        self.wait(2)
        self.clear_all()

    def context(self):
        self.header(1, "vantagem", "Contexto que o agente encontra sozinho")
        agents = accent_card("AGENTS.md", w=3.0, h=0.9, size=22, color=INK).shift(LEFT * 4 + DOWN * 0.3)
        targets = ["skills", "rules", "ADRs", "specs", "PRDs", "deferrals"]
        col = VGroup(*[card(t, w=2.6, h=0.6, size=16) for t in targets]).arrange(DOWN, buff=0.15)
        col.shift(RIGHT * 0.6 + DOWN * 0.3)
        arrows = VGroup(*[
            Arrow(agents.get_right(), c.get_left(), buff=0.15, stroke_width=2, color=INK3, tip_length=0.15)
            for c in col
        ])
        self.play(FadeIn(agents, shift=RIGHT * 0.2))
        self.play(LaggedStart(*[AnimationGroup(GrowArrow(a), FadeIn(c)) for a, c in zip(arrows, col)], lag_ratio=0.12))
        q = mono('qmd query -c adrs "..."', 20, INK2).next_to(col, RIGHT, buff=0.6).shift(UP * 0.4)
        ql = label("busca antes de chutar", 14).next_to(q, UP, aligned_edge=LEFT, buff=0.15)
        self.play(FadeIn(ql), Write(q))
        self.play(col[2][0].animate.set_stroke(ACCENT, 3), run_time=0.6)
        self.takeaway("Um ponto de entrada, um mapa — menos alucinação, menos repetição.")
        self.wait(2)
        self.clear_all()

    def decisions(self):
        self.header(2, "vantagem", "Decisões que não se perdem")
        ax_left = LEFT * 3.6
        ax_right = RIGHT * 3.6
        lt = label("sem registro", 16, INK3).move_to(ax_left + UP * 1.6)
        rt = label("com ADR stable", 16, ACCENT).move_to(ax_right + UP * 1.6)
        origin_l = ax_left + LEFT * 2.6 + DOWN * 0.3
        origin_r = ax_right + LEFT * 2.6 + DOWN * 0.3
        drift = VGroup(*[
            Line(origin_l, origin_l + RIGHT * 5.2 + UP * dy, stroke_color=c, stroke_width=3)
            for dy, c in [(1.1, INK3), (0.4, INK2), (-0.5, INK3), (-1.2, INK2)]
        ])
        anchor = Line(origin_r, origin_r + RIGHT * 5.2, stroke_color=ACCENT, stroke_width=4)
        held = VGroup(*[
            Line(origin_r, origin_r + RIGHT * 5.2 + UP * dy, stroke_color=INK2, stroke_width=2)
            for dy in [0.08, -0.08]
        ])
        dl = body("cada sessão decide de novo", 18, INK3).next_to(drift, DOWN, buff=0.3)
        al = body("toda sessão cita a mesma decisão", 18, INK2).next_to(anchor, DOWN, buff=1.3)
        divider = Line(UP * 1.8, DOWN * 1.9, stroke_color=RULE, stroke_width=2)
        self.play(FadeIn(lt), FadeIn(rt), Create(divider))
        self.play(LaggedStart(*[Create(l) for l in drift], lag_ratio=0.2), FadeIn(dl), run_time=1.6)
        self.play(Create(anchor), LaggedStart(*[Create(l) for l in held], lag_ratio=0.2), FadeIn(al), run_time=1.6)
        tag = mono("ADR-001", 18, ACCENT).next_to(anchor, UP, buff=0.15).align_to(anchor, LEFT)
        self.play(FadeIn(tag))
        self.takeaway("Citar um ADR é um contrato: o validate falha se ele não for stable.")
        self.wait(2)
        self.clear_all()

    def verify(self):
        self.header(3, "vantagem", "O agente confere o próprio trabalho")
        steps = ["implementa", "validate", "comments", "score"]
        nodes = VGroup(*[card(s, w=2.4, h=0.8, size=18) for s in steps])
        pos = [UP * 0.9, RIGHT * 3.2 + DOWN * 0.3, DOWN * 1.5, LEFT * 3.2 + DOWN * 0.3]
        for n, p in zip(nodes, pos):
            n.move_to(p + DOWN * 0.1)
        arcs = VGroup(*[
            CurvedArrow(nodes[i].get_center(), nodes[(i + 1) % 4].get_center(), angle=-PI / 3, color=INK3, stroke_width=2, tip_length=0.18)
            for i in range(4)
        ])
        for a in arcs:
            a.scale(0.55)
        self.play(LaggedStart(*[FadeIn(n) for n in nodes], lag_ratio=0.15))
        self.play(LaggedStart(*[Create(a) for a in arcs], lag_ratio=0.15))
        dot = Dot(radius=0.11, color=ACCENT).move_to(nodes[0])
        self.play(FadeIn(dot))
        for i in [1, 2, 3, 0]:
            self.play(dot.animate.move_to(nodes[i]), Indicate(nodes[i][0], color=ACCENT, scale_factor=1.05), run_time=0.5)
        done = accent_card("entrega revisada", w=3.0, h=0.7, size=16, color=INK).next_to(nodes[1], DOWN, buff=0.6)
        self.play(FadeIn(done, shift=RIGHT * 0.2))
        self.takeaway("Você revisa intenção, não erros que uma checagem já pegaria.")
        self.wait(2)
        self.clear_all()

    def scope(self):
        self.header(4, "vantagem", "Escopo sob controle")
        ask = card("pedido", w=2.4, h=0.8, size=18, color=INK).shift(LEFT * 4.5)
        guard = accent_card("pragmatic-guard", w=3.0, h=0.9, size=18, color=INK)
        build = card("constrói agora", w=2.8, h=0.7, size=16, color=INK).shift(RIGHT * 4.3 + UP * 1.0)
        defer = card("docs/deferrals/", w=2.8, h=0.7, size=16, color=INK3, upper=False).shift(RIGHT * 4.3 + DOWN * 1.0)
        trig = body("com gatilho de revisão", 16, INK3).next_to(defer, DOWN, buff=0.15)
        a1 = Arrow(ask.get_right(), guard.get_left(), buff=0.1, color=INK3, stroke_width=2, tip_length=0.15)
        a2 = Arrow(guard.get_right(), build.get_left(), buff=0.1, color=ACCENT, stroke_width=3, tip_length=0.15)
        a3 = Arrow(guard.get_right(), defer.get_left(), buff=0.1, color=INK3, stroke_width=2, tip_length=0.15)
        self.play(FadeIn(ask))
        self.play(GrowArrow(a1), FadeIn(guard))
        self.play(GrowArrow(a2), FadeIn(build), GrowArrow(a3), FadeIn(defer), FadeIn(trig))
        q = body("“a gente pode precisar…” → precisa agora?", 20, INK2).next_to(guard, UP, buff=0.5)
        self.play(Write(q))
        self.takeaway("YAGNI estrito: o que fica de fora é registrado, não esquecido.")
        self.wait(2)
        self.clear_all()

    def control(self):
        self.header(5, "vantagem", "Processo previsível, humano no comando")
        steps = ["code-spec", "code-plan", "code-execute", "code-commit", "code-pr"]
        row = VGroup(*[card(s, w=2.25, h=0.75, size=15) for s in steps]).arrange(RIGHT, buff=0.35).shift(UP * 0.3)
        arrows = VGroup(*[
            Arrow(row[i].get_right(), row[i + 1].get_left(), buff=0.04, stroke_width=2, color=INK3, tip_length=0.12)
            for i in range(4)
        ])
        gates = VGroup()
        for i in [0, 1, 3, 4]:
            g = label("você aprova", 12, ACCENT).next_to(row[i], DOWN, buff=0.2)
            gates.add(g)
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.15) for c in row], lag_ratio=0.12))
        self.play(LaggedStart(*[GrowArrow(a) for a in arrows], lag_ratio=0.1))
        self.play(LaggedStart(*[FadeIn(g) for g in gates], lag_ratio=0.15))
        never = accent_card("nunca faz merge", w=3.0, h=0.7, size=16, color=INK).next_to(row[4], UP, buff=0.35)
        never.align_to(row[4], RIGHT)
        self.play(FadeIn(never, shift=DOWN * 0.15))
        self.takeaway("Commits manuais por padrão; PR, review e CI só quando você pede.")
        self.wait(2)
        self.clear_all()

    def portable(self):
        self.header(6, "vantagem", "Um harness, vários agentes")
        src = accent_card(".agents/skills", w=3.2, h=0.9, size=18, color=INK).shift(LEFT * 3.5 + DOWN * 0.3)
        rts = VGroup(*[card(r, w=2.6, h=0.7, size=18) for r in ["Claude Code", "Codex", "Cursor"]])
        rts.arrange(DOWN, buff=0.35).shift(RIGHT * 3 + DOWN * 0.3)
        arrows = VGroup(*[
            Arrow(src.get_right(), r.get_left(), buff=0.15, color=INK3, stroke_width=2, tip_length=0.15) for r in rts
        ])
        self.play(FadeIn(src))
        self.play(LaggedStart(*[AnimationGroup(GrowArrow(a), FadeIn(r)) for a, r in zip(arrows, rts)], lag_ratio=0.2))
        cmd = mono("--runtimes claude,codex,cursor", 18, INK2).next_to(src, DOWN, buff=0.5)
        self.play(Write(cmd))
        self.takeaway("Troque de agente sem reescrever suas regras.")
        self.wait(2)
        self.clear_all()

    def measurable(self):
        self.header(7, "vantagem", "Maturidade que se mede")
        levels = ["L0", "L1", "L2", "L3", "L4"]
        base = DOWN * 1.6
        bars = VGroup()
        for i, lv in enumerate(levels):
            h = 0.35 + i * 0.55
            r = Rectangle(width=1.1, height=h, stroke_width=0,
                          fill_color=ACCENT if i >= 3 else RULE, fill_opacity=1)
            r.move_to(base + RIGHT * (i - 2) * 1.6, aligned_edge=DOWN)
            t = label(lv, 18, INK).next_to(r, DOWN, buff=0.2)
            bars.add(VGroup(r, t))
        floor = Line(LEFT * 4.4, RIGHT * 4.4, stroke_color=INK3, stroke_width=2).move_to(base)
        self.play(Create(floor))
        self.play(LaggedStart(*[AnimationGroup(GrowFromEdge(b[0], DOWN), FadeIn(b[1])) for b in bars], lag_ratio=0.15))
        y = base[1] + 0.35 + 3 * 0.55
        tgt = DashedLine(LEFT * 4.4 + UP * y, RIGHT * 4.4 + UP * y, stroke_color=INK, stroke_width=2, dash_length=0.12)
        tl = mono("harness-score --min-level 3", 18, INK).next_to(tgt, UP, buff=0.1).align_to(tgt, LEFT)
        self.play(Create(tgt), FadeIn(tl))
        self.takeaway("Checks que você descarta aparecem como drops no relatório.")
        self.wait(2)
        self.clear_all()

    def outro(self):
        items = [
            "contexto encontrável",
            "decisões que valem",
            "trabalho auto-verificado",
            "escopo enxuto",
            "você no comando",
        ]
        rows = VGroup()
        for i, s in enumerate(items):
            n = label(f"{i + 1:02d}", 18)
            t = display(s, 34)
            rows.add(VGroup(n, t).arrange(RIGHT, buff=0.35))
        rows.arrange(DOWN, aligned_edge=LEFT, buff=0.3).shift(UP * 0.7 + LEFT * 1.5)
        for r in rows:
            self.play(FadeIn(r, shift=RIGHT * 0.2), run_time=0.45)
        self.wait(0.8)
        box = Rectangle(width=9.4, height=0.9, stroke_color=RULE, stroke_width=2, fill_color=SURFACE, fill_opacity=1)
        cmd = mono("pnpm add -D @wolven-tech/harness", 26, INK).move_to(box)
        g = VGroup(box, cmd).to_edge(DOWN, buff=0.8)
        self.play(FadeIn(box), Write(cmd))
        logo = ImageMobject(str(LOGO)).scale_to_fit_height(0.8).to_corner(UR, buff=0.6)
        self.play(FadeIn(logo))
        self.wait(2.5)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
