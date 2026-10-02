from manim import *

BLUE_3B = "#58C4DD"; YEL = "#FFFF00"; GRN = "#83C167"; RED_3B = "#FC6255"; GREY_3B = "#888888"
config.background_color = "#111111"
F = "DejaVu Sans"

def T(s, size=32, color=WHITE, **k):
    return Text(s, font=F, font_size=size, color=color, **k)

def box(label, color=BLUE_3B, w=3.2, h=0.9, size=24):
    r = RoundedRectangle(corner_radius=0.15, width=w, height=h, color=color, fill_opacity=0.12)
    return VGroup(r, T(label, size, color).move_to(r))


class HarnessExplainer(Scene):
    def title(self, s):
        t = T(s, 40, YEL).to_edge(UP)
        self.play(Write(t)); return t

    def clear_all(self):
        self.play(*[FadeOut(m) for m in self.mobjects]); self.wait(0.2)

    def construct(self):
        self.intro(); self.problem(); self.anatomy(); self.workflow()
        self.claims(); self.checks(); self.score(); self.outro()

    def intro(self):
        name = T("wolven-harness", 64, BLUE_3B)
        sub = T("um arnês para agentes de IA", 30, GREY_3B).next_to(name, DOWN)
        self.play(Write(name)); self.play(FadeIn(sub, shift=UP*0.3)); self.wait(1.5)
        self.clear_all()

    def problem(self):
        t = self.title("O problema")
        agent = Circle(0.6, color=YEL, fill_opacity=0.3); al = T("agente", 22).next_to(agent, DOWN)
        g = VGroup(agent, al).shift(LEFT*3)
        self.play(GrowFromCenter(agent), FadeIn(al))
        qs = ["onde ficam as instruções?", "o que já foi decidido?", "meu trabalho está certo?", "qual padrão seguir?"]
        items = VGroup(*[T("? " + q, 24, RED_3B) for q in qs]).arrange(DOWN, aligned_edge=LEFT, buff=0.4).shift(RIGHT*2)
        for it in items:
            self.play(FadeIn(it, shift=LEFT*0.3), run_time=0.6)
        self.play(Wiggle(agent)); self.wait(1)
        ans = T("cada sessão começa do zero", 28, YEL).to_edge(DOWN)
        self.play(Write(ans)); self.wait(1.5)
        self.clear_all()

    def anatomy(self):
        t = self.title("Anatomia: um repositório que se explica")
        center = box("AGENTS.md", YEL, w=3, h=1, size=30)
        self.play(DrawBorderThenFill(center[0]), Write(center[1]))
        parts = [("skills/", ".agents/skills", "UL"), ("rules/", ".agents/rules", "UR"),
                 ("ADRs", "docs/adrs", "L"), ("specs + plans", "docs/specs", "R"),
                 ("PRDs", "docs/prds", "DL"), ("deferrals", "docs/deferrals", "DR")]
        pos = {"UL": [-4.5, 1.6, 0], "UR": [4.5, 1.6, 0], "L": [-4.8, 0, 0], "R": [4.8, 0, 0], "DL": [-4.5, -1.6, 0], "DR": [4.5, -1.6, 0]}
        grp = VGroup()
        for lab, path, d in parts:
            b = box(lab, BLUE_3B, w=2.8, h=0.8).move_to(pos[d])
            p = T(path, 16, GREY_3B).next_to(b, DOWN, buff=0.1)
            a = Arrow(center.get_center(), b.get_center(), buff=1.0, color=GREY_3B, stroke_width=3)
            self.play(GrowArrow(a), FadeIn(b), FadeIn(p), run_time=0.5); grp.add(a, b, p)
        cap = T("o agente lê AGENTS.md e encontra tudo o resto", 26, GRN).to_edge(DOWN)
        self.play(Write(cap)); self.wait(2)
        inst = T("$ pnpm exec wolven-harness setup", 28, GRN)
        self.play(FadeOut(grp), FadeOut(cap), center.animate.shift(UP*0.8))
        inst.next_to(center, DOWN, buff=0.8)
        note = T("cria só o que falta · nunca edita o seu AGENTS.md · nunca commita", 22, GREY_3B).next_to(inst, DOWN)
        self.play(Write(inst)); self.play(FadeIn(note)); self.wait(2)
        self.clear_all()

    def workflow(self):
        t = self.title("O fluxo: das ideias ao commit")
        steps = [("create-prd", GREY_3B), ("code-spec", BLUE_3B), ("code-plan", BLUE_3B),
                 ("code-execute", GRN), ("code-commit", YEL), ("code-pr", GREY_3B)]
        bs = VGroup(*[box(s, c, w=2.0, h=0.8, size=20) for s, c in steps]).arrange(RIGHT, buff=0.3).shift(UP*0.5)
        arrows = VGroup(*[Arrow(bs[i].get_right(), bs[i+1].get_left(), buff=0.05, stroke_width=3, max_tip_length_to_length_ratio=0.3) for i in range(5)])
        desc = ["problema confirmado", "o que muda e como verificar", "passos ordenados", "implementa + checa", "quando você pedir", "abre PR, nunca faz merge"]
        ds = VGroup(*[T(d, 15, GREY_3B).next_to(bs[i], DOWN if i % 2 == 0 else DOWN*3.2, buff=0.25) for i, d in enumerate(desc)])
        for i in range(6):
            anims = [FadeIn(bs[i], shift=UP*0.2), FadeIn(ds[i])]
            if i: anims.append(GrowArrow(arrows[i-1]))
            self.play(*anims, run_time=0.7)
        dot = Dot(color=YEL, radius=0.12).move_to(bs[0])
        self.play(FadeIn(dot))
        for i in range(1, 6):
            self.play(dot.animate.move_to(bs[i]), Indicate(bs[i], color=YEL), run_time=0.6)
        note = T("cada skill é um SKILL.md: instruções versionadas junto com o código", 22, GRN).to_edge(DOWN)
        self.play(Write(note)); self.wait(2)
        self.clear_all()

    def claims(self):
        t = self.title("Decisões como contratos: ADRs")
        file = box("src/qualquer.ts", WHITE, w=3.4, size=22).shift(LEFT*4)
        claim = T('"conforme ADR-001"', 22, YEL).next_to(file, DOWN)
        self.play(FadeIn(file), Write(claim))
        adrs = VGroup(box("adr-001  stable", GRN, w=3.4, size=20),
                      box("adr-002  draft", RED_3B, w=3.4, size=20),
                      box("adr-003  deprecated", RED_3B, w=3.4, size=20)).arrange(DOWN, buff=0.3).shift(RIGHT*3.5)
        self.play(LaggedStart(*[FadeIn(a) for a in adrs], lag_ratio=0.2))
        a = Arrow(claim.get_right(), adrs[0].get_left(), color=GRN)
        self.play(GrowArrow(a)); self.play(Indicate(adrs[0], color=GRN))
        ok = T("✓ resolve para exatamente um ADR stable", 24, GRN).to_edge(DOWN).shift(UP*0.5)
        self.play(Write(ok)); self.wait(1)
        a2 = Arrow(claim.get_right(), adrs[1].get_left(), color=RED_3B)
        bad = T("✗ draft, deprecated ou ambíguo → validate falha", 24, RED_3B).next_to(ok, DOWN)
        self.play(ReplacementTransform(a, a2), Write(bad)); self.wait(2)
        self.clear_all()

    def checks(self):
        t = self.title("Três verificações")
        cols = [("validate", "perfil de escrita\n+ claims de ADR", BLUE_3B),
                ("comments", "comentários why: /\nhazard: / invariant:", YEL),
                ("score", "nota do harness\nL0 → L4", GRN)]
        g = VGroup()
        for name, d, c in cols:
            b = box(name, c, w=3.2, h=1.0, size=30)
            dd = T(d, 20, GREY_3B).next_to(b, DOWN)
            g.add(VGroup(b, dd))
        g.arrange(RIGHT, buff=0.8)
        self.play(LaggedStart(*[FadeIn(x, shift=UP*0.3) for x in g], lag_ratio=0.3))
        cmd = T("pnpm harness:validate · harness:comments · harness:score", 22, WHITE).to_edge(DOWN)
        self.play(Write(cmd)); self.wait(2)
        self.clear_all()

    def score(self):
        t = self.title("Harness score: subindo de nível")
        ax = Axes(x_range=[0, 5, 1], y_range=[0, 4.5, 1], x_length=8, y_length=4.2, tips=False,
                  axis_config={"color": GREY_3B}).shift(DOWN*0.4)
        self.play(Create(ax))
        lv = ["L0", "L1", "L2", "L3", "L4"]
        bars = VGroup()
        for i, l in enumerate(lv):
            r = Rectangle(width=1.0, height=max(0.01, ax.y_axis.unit_size * i), fill_opacity=0.7,
                          color=interpolate_color(ManimColor(RED_3B), ManimColor(GRN), i/4), stroke_width=0)
            r.move_to(ax.c2p(i+0.5, 0), aligned_edge=DOWN)
            lab = T(l, 22).next_to(ax.c2p(i+0.5, 0), DOWN)
            bars.add(VGroup(r, lab))
        self.play(LaggedStart(*[GrowFromEdge(b[0], DOWN) for b in bars], *[FadeIn(b[1]) for b in bars], lag_ratio=0.15))
        tgt = DashedLine(ax.c2p(0, 3), ax.c2p(5, 3), color=YEL)
        tl = T("--min-level 3", 20, YEL).next_to(tgt, UP, aligned_edge=RIGHT)
        self.play(Create(tgt), Write(tl))
        n = T("checks que o repo não quer construir são 'drops' visíveis no relatório", 20, GREY_3B).to_edge(DOWN)
        self.play(FadeIn(n)); self.wait(2)
        self.clear_all()

    def outro(self):
        a = T("instruções que o agente encontra", 30, BLUE_3B)
        b = T("decisões que ele pode citar", 30, YEL)
        c = T("verificações que ele mesmo roda", 30, GRN)
        g = VGroup(a, b, c).arrange(DOWN, buff=0.5)
        for x in g:
            self.play(Write(x), run_time=0.9)
        self.wait(1)
        self.play(g.animate.shift(UP*1.2))
        cmd = T("pnpm add -D @wolven-tech/harness", 28, WHITE).next_to(g, DOWN, buff=0.8)
        self.play(Write(cmd)); self.wait(2.5)
        self.clear_all()
