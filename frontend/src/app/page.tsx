import Link from "next/link";
import { LandingAuthCta } from "@/components/landing-auth-cta";
import { LandingHeader } from "@/components/landing-header";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-8 md:px-8">
      <LandingHeader />

      <section id="hero" className="grid scroll-mt-28 items-center gap-8 lg:grid-cols-2">
        <div className="animate-[fadeUp_400ms_ease-out]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">
            HomeFlow
          </p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-tight text-zinc-900 md:text-6xl">
            Быт под контролем. Жизнь без рутины.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-zinc-600">
            Подписка на уборку и домашние сервисы с прозрачной стоимостью, автоматическим графиком и стабильным качеством.
          </p>

          <LandingAuthCta />

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
              <p className="text-2xl font-semibold text-zinc-900">4.9</p>
              <p className="text-xs text-zinc-500">рейтинг сервиса</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
              <p className="text-2xl font-semibold text-zinc-900">2ч</p>
              <p className="text-xs text-zinc-500">в неделю экономии</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
              <p className="text-2xl font-semibold text-zinc-900">24/7</p>
              <p className="text-xs text-zinc-500">поддержка оператора</p>
            </div>
          </div>
        </div>

        <div id="how-it-works" className="scroll-mt-28 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(3,8,20,0.12)] backdrop-blur animate-[fadeUp_550ms_ease-out]">
          <p className="text-sm font-semibold text-zinc-900">Как это работает</p>
          <ol className="mt-4 space-y-3 text-sm text-zinc-700">
            <li className="rounded-xl bg-zinc-50 p-3">1. Вы регистрируетесь и указываете адрес.</li>
            <li className="rounded-xl bg-zinc-50 p-3">2. Выбираете тариф, площадь и пожелания.</li>
            <li className="rounded-xl bg-zinc-50 p-3">3. Получаете автографик уборок и назначения.</li>
            <li className="rounded-xl bg-zinc-50 p-3">4. Контролируете визиты, оплату и качество в приложении.</li>
          </ol>
        </div>
      </section>

      <section id="features" className="mt-12 grid scroll-mt-28 gap-4 md:grid-cols-3">
        {[
          {
            title: "Предсказуемый график",
            text: "Уборки планируются автоматически, напоминания приходят заранее.",
          },
          {
            title: "Прозрачная цена",
            text: "Фиксированный тариф без скрытых доплат и удобная история списаний.",
          },
          {
            title: "Контроль качества",
            text: "Фотоотчет, оценки и операторская реакция на инциденты.",
          },
        ].map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-white/70 bg-white/85 p-5">
            <h2 className="text-lg font-semibold text-zinc-900">{feature.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{feature.text}</p>
          </article>
        ))}
      </section>

      <section id="plans" className="mt-12 rounded-3xl border border-zinc-200 bg-white p-6 scroll-mt-28">
        <h2 className="text-2xl font-semibold">Тарифы</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { name: "Lite", visits: "1 раз/мес", price: "4 200 ₽" },
            { name: "Smart", visits: "2 раза/мес", price: "7 600 ₽" },
            { name: "Flow+", visits: "4 раза/мес", price: "13 900 ₽" },
          ].map((plan) => (
            <div key={plan.name} className="rounded-2xl border border-zinc-200 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">{plan.name}</p>
              <p className="mt-2 text-xl font-semibold text-zinc-900">{plan.visits}</p>
              <p className="mt-1 text-zinc-600">от {plan.price}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/onboarding"
            className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white"
          >
            Попробовать HomeFlow
          </Link>
          <Link
            href="/onboarding"
            className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800"
          >
            Посмотреть конфигуратор подписки
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-white/70 bg-white/85 p-6">
          <h3 className="text-xl font-semibold text-zinc-900">Отзывы клиентов</h3>
          <div className="mt-4 space-y-3 text-sm text-zinc-700">
            <blockquote className="rounded-xl bg-zinc-50 p-3">
              "Стабильное качество и всегда понятный график, без сюрпризов по цене."
            </blockquote>
            <blockquote className="rounded-xl bg-zinc-50 p-3">
              "Оператор быстро решает вопросы, а история уборок всегда под рукой."
            </blockquote>
          </div>
        </article>

        <article className="rounded-3xl border border-white/70 bg-white/85 p-6">
          <h3 className="text-xl font-semibold text-zinc-900">Частые вопросы</h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-700">
            <li className="rounded-xl bg-zinc-50 p-3">
              <p className="font-semibold">Можно ли перенести уборку?</p>
              <p className="mt-1 text-zinc-600">Да, в графике выбираете заказ и новую дату через datepicker.</p>
            </li>
            <li className="rounded-xl bg-zinc-50 p-3">
              <p className="font-semibold">Как контролируется качество?</p>
              <p className="mt-1 text-zinc-600">Через оценки по выполненным заказам и обработку жалоб оператором.</p>
            </li>
          </ul>
        </article>
      </section>

      <footer className="mt-12 text-center text-sm text-zinc-500">
        HomeFlow © 2026. Умный сервис подписки на бытовые услуги.
      </footer>
    </main>
  );
}
